import { ArgumentError } from '../errors/index.js';
import { formatDuration, parseDuration } from '../util/util.js';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USER_MENTION = /^<@!?([\w-]+)>$/;
const CHANNEL_MENTION = /^<#([\w-]+)>$/;
const TRUE = new Set(['true', 'yes', 'y', 'on', '1', 'enable', 'enabled']);
const FALSE = new Set(['false', 'no', 'n', 'off', '0', 'disable', 'disabled']);

const bad = (option, value, message) => new ArgumentError(message, { option: option.name, value });

function checkRange(option, value, n, what = '') {
  if (option.min !== undefined && n < option.min) throw bad(option, value, `\`${option.name}\` must be at least ${option.min}${what}`);
  if (option.max !== undefined && n > option.max) throw bad(option, value, `\`${option.name}\` must be at most ${option.max}${what}`);
}

/**
 * How each option type turns text into a value. `resolve(text, ctx, option)` returns the value or
 * throws an ArgumentError (shown to the person). Add your own with `client.commands.types.register`.
 */
export const BuiltinTypes = {
  string: {
    resolve(text, _ctx, option) {
      checkRange(option, text, text.length, ' characters');
      return text;
    },
  },

  integer: {
    resolve(text, _ctx, option) {
      const n = Number(text.replace(/[_,]/g, ''));
      if (!/^[-+]?[\d_,]+$/.test(text) || !Number.isSafeInteger(n)) throw bad(option, text, `\`${option.name}\` must be a whole number`);
      checkRange(option, text, n);
      return n;
    },
  },

  number: {
    resolve(text, _ctx, option) {
      const n = Number(text.replace(/[_,]/g, ''));
      if (!Number.isFinite(n)) throw bad(option, text, `\`${option.name}\` must be a number`);
      checkRange(option, text, n);
      return n;
    },
  },

  boolean: {
    resolve(text, _ctx, option) {
      const t = text.toLowerCase();
      if (TRUE.has(t)) return true;
      if (FALSE.has(t)) return false;
      throw bad(option, text, `\`${option.name}\` must be yes or no`);
    },
  },

  /** A mention, an id, or (in a server) a cached member's name. Resolves to a User. */
  user: {
    async resolve(text, ctx, option) {
      const id = USER_MENTION.exec(text)?.[1] ?? (ID.test(text) ? text : null);
      if (id) {
        try {
          return await ctx.client.users.fetch(id);
        } catch {
          throw bad(option, text, `I can't find that user (\`${option.name}\`)`);
        }
      }
      const byName = ctx.server?.members.search(text).first();
      if (byName) return byName.user;
      throw bad(option, text, `\`${option.name}\` must be a user: mention them or paste their id`);
    },
  },

  /** Like user, but the ServerMember in this server. */
  member: {
    async resolve(text, ctx, option) {
      if (!ctx.server) throw bad(option, text, `\`${option.name}\` only works in a server`);
      const id = USER_MENTION.exec(text)?.[1] ?? (ID.test(text) ? text : null);
      if (id) {
        try {
          return await ctx.server.members.fetch(id);
        } catch {
          throw bad(option, text, `That person isn't in this server (\`${option.name}\`)`);
        }
      }
      const byName = ctx.server.members.search(text).first();
      if (byName) return byName;
      throw bad(option, text, `\`${option.name}\` must be someone in this server: mention them or paste their id`);
    },
  },

  /** A #mention, an id, or a channel name in this server. `channelTypes: ['text']` narrows it. */
  channel: {
    async resolve(text, ctx, option) {
      const id = CHANNEL_MENTION.exec(text)?.[1] ?? (ID.test(text) ? text : null);
      let channel = null;
      if (id) channel = await ctx.client.channels.fetch(id).catch(() => null);
      else if (ctx.server) {
        channel = ctx.server.channels.findByName(text);
        if (!channel) {
          await ctx.server.channels.ensure().catch(() => null);
          channel = ctx.server.channels.findByName(text);
        }
      }
      if (!channel) throw bad(option, text, `I can't find that channel (\`${option.name}\`)`);
      if (option.channelTypes && !option.channelTypes.includes(channel.type)) {
        throw bad(option, text, `\`${option.name}\` must be a ${option.channelTypes.join(' or ')} channel`);
      }
      return channel;
    },
  },

  /** An id or a role name ('@' optional). */
  role: {
    async resolve(text, ctx, option) {
      if (!ctx.server) throw bad(option, text, `\`${option.name}\` only works in a server`);
      await ctx.server.roles.ensure();
      const role = ctx.server.roles.resolve(text);
      if (!role) throw bad(option, text, `I can't find a role called "${text}"`);
      return role;
    },
  },

  /** '10m', '1h30m', '2 days' → milliseconds. `min` / `max` are in ms too. */
  duration: {
    resolve(text, _ctx, option) {
      const ms = parseDuration(text);
      if (ms === null || /^\d+(\.\d+)?$/.test(text)) throw bad(option, text, `\`${option.name}\` must be a duration like 10m, 2h or 1d`);
      if (option.min !== undefined && ms < option.min) throw bad(option, text, `\`${option.name}\` must be at least ${formatDuration(option.min)}`);
      if (option.max !== undefined && ms > option.max) throw bad(option, text, `\`${option.name}\` must be at most ${formatDuration(option.max)}`);
      return ms;
    },
  },

  url: {
    resolve(text, _ctx, option) {
      try {
        const url = new URL(text.replace(/^<|>$/g, ''));
        if (!/^https?:$/.test(url.protocol)) throw new Error();
        return url;
      } catch {
        throw bad(option, text, `\`${option.name}\` must be a link starting with https://`);
      }
    },
  },
};

export class ArgumentTypeRegistry extends Map {
  constructor() {
    super(Object.entries(BuiltinTypes));
  }

  /**
   *   client.commands.types.register('color', (text) => /^#[0-9a-f]{6}$/i.test(text) ? text : undefined)
   * Return undefined (or throw an ArgumentError) when the text isn't valid.
   */
  register(name, resolve, { message } = {}) {
    const fn = typeof resolve === 'function' ? resolve : resolve.resolve;
    this.set(name, {
      async resolve(text, ctx, option) {
        const value = await fn(text, ctx, option);
        if (value === undefined) throw bad(option, text, message ?? `\`${option.name}\` must be a ${name}`);
        return value;
      },
    });
    return this;
  }
}

