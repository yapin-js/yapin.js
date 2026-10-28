/**
 * Yapin’ bot SDK, one file, no dependencies. Node 18+, Bun and Deno.
 *
 *   import { Bot } from './yapper.js';
 *   const bot = new Bot(process.env.YAPPER_BOT_TOKEN);
 *   bot.command('ping', 'Check the bot is alive', (msg) => msg.reply('pong'));
 *   bot.on('message', (msg) => { if (msg.mentioned) msg.reply('hi!'); });
 *   bot.on('member_join', async (ev) => {
 *     const [general] = await bot.channels(ev.server_id, { type: 'text' });   // member events have no channel
 *     if (general) bot.send(general.id, `welcome <@${ev.user_id}>`);
 *   });
 *   bot.command('info', 'A card', (msg) => msg.reply('', { embeds: [new Embed().title('Hi').description('**Embeds** work').color('#5865f2')] }));
 *   bot.command('vote', 'Buttons', (msg) => msg.reply('Pizza?', { components: [new Row(Button.success('Yes', 'vote:yes'), Button.danger('No', 'vote:no'))] }));
 *   bot.onButton(/^vote:/, (i) => i.ephemeral(`You picked ${i.custom_id.slice(5)}`));
 *   await bot.loadCogs('./cogs');   // optional: more commands from cogs/*.js (see Cog below)
 *   bot.start();
 *
 * Nothing to host: the bot fetches its own events from Yapin’ (long polling), so it runs on your PC.
 * Verified bots can also run on Yapin’s bot hosting, which passes the token in process.env.YAPPER_BOT_TOKEN.
 * Docs: https://www.yapin.gg/developers
 */
/** Embeds, buttons and rows can be builders or plain objects. */
/** Message flag for Components V2 layouts (IS_COMPONENTS_V2, 1 << 15). */
export const IS_COMPONENTS_V2 = 1 << 15;
const plain = (x) => (x && typeof x.toJSON === 'function' ? x.toJSON() : x);
const list = (v) => (v === undefined ? undefined : v === null ? null : [].concat(v).map(plain));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** `{ messages, authors }` from the API → the messages, each with its `author` (null if the account is gone). */
const withAuthors = (out) => {
  const by = new Map((out.authors || []).map((a) => [a.id, a]));
  return (out.messages || []).map((m) => ({ ...m, author: by.get(m.author_id) ?? null }));
};
/** Wait before retry number n (1, 2, …): 1s, 2s, 4s … up to 30s, with some jitter so many bots don't sync up. */
const backoff = (n) => Math.min(30_000, 1000 * 2 ** (n - 1)) * (0.75 + Math.random() * 0.5);
/**
 * Encrypted calls (connectVoice): the bot's half of the app's key handoff. Our P-256 public key goes in the
 * participant attribute `e2ee`; everyone who has one gets our media key over the data channel (topic yapper-e2ee),
 * sealed with AES-GCM under the ECDH secret the two of us share and bound to "<from>|<to>|<index>". The bot hears
 * nobody, so it never needs anyone's key back, only to answer when someone sends theirs (they may have missed ours).
 */
async function handOutVoiceKey(room, subtle, mediaKey) {
  const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const me = room.localParticipant.identity;
  const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  const myPub = b64(await subtle.exportKey('raw', pair.publicKey));
  const shared = new Map();
  const sent = new Map();
  let stopped = false;
  const sendTo = async (p, pub) => {
    const theirPub = p?.attributes?.e2ee || pub;
    if (stopped || !theirPub || p.identity === me || sent.get(p.identity) === theirPub) return;
    sent.set(p.identity, theirPub);
    try {
      let k = shared.get(theirPub);
      if (!k) {
        const their = await subtle.importKey('raw', unb64(theirPub), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
        k = await subtle.deriveKey({ name: 'ECDH', public: their }, pair.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
        shared.set(theirPub, k);
      }
      const iv = (globalThis.crypto ?? (await import('node:crypto')).webcrypto).getRandomValues(new Uint8Array(12));
      const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(`${me}|${p.identity}|0`) }, k, mediaKey);
      const msg = JSON.stringify({ i: 0, iv: b64(iv), ct: b64(ct), k: myPub });
      await room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true, topic: 'yapper-e2ee', destination_identities: [p.identity] });
    } catch {
      sent.delete(p.identity); // muted by a moderator (no data permission) or a bad key: try again on the next change
    }
  };
  const onPeer = (p) => { void sendTo(p); };
  const onAttrs = (_changed, p) => { void sendTo(p); };
  const onData = (payload, who, _kind, topic) => {
    if (topic !== 'yapper-e2ee' || !who) return;
    try { const m = JSON.parse(new TextDecoder().decode(payload)); if (typeof m.k === 'string') { sent.delete(who.identity); void sendTo(who, m.k); } } catch { /* not ours */ }
  };
  room.on('participantConnected', onPeer).on('participantAttributesChanged', onAttrs).on('dataReceived', onData);
  await room.localParticipant.setAttributes({ e2ee: myPub });
  for (const p of room.remoteParticipants.values()) void sendTo(p);
  return {
    stop() {
      stopped = true;
      room.off('participantConnected', onPeer).off('participantAttributesChanged', onAttrs).off('dataReceived', onData);
    },
  };
}
/** A class made with `extends Cog` (not Cog itself). Checked by a flag, so a second copy of yapper.js still works. */
const isCogClass = (c) => typeof c === 'function' && c.yapperCog === true && !Object.hasOwn(c, 'yapperCog');
/** Marks an error with the cog (and command or event) it came from, so the log says where it broke. */
const tagError = (e, owner, where) => {
  const err = e instanceof Error ? e : new Error(String(e));
  if (err.cog === undefined) { try { err.cog = owner.name; if (where) err.where = where; } catch { /* frozen error */ } }
  return err;
};
/** Runs fn with `self` as this and tags anything it throws with the cog. */
const tagged = (owner, fn, self, where) => async (x) => { try { return await fn.call(self, x); } catch (e) { throw tagError(e, owner, where); } };
const COMMAND_LIMIT = 100;

/**
 * Finds a cog file or folder. Relative paths are tried next to your main file first (the one you ran with
 * `node bot.js`), then in the folder you ran node in. Also takes absolute paths and file:// URLs.
 * Returns { abs, url, label }; url is what import() wants, also on Windows.
 */
async function locate(target) {
  const [{ pathToFileURL, fileURLToPath }, path, fs] = await Promise.all([import('node:url'), import('node:path'), import('node:fs')]);
  const raw = target instanceof URL ? target.href : String(target ?? '');
  let tries;
  if (/^file:/i.test(raw)) tries = [fileURLToPath(raw)];
  else if (path.isAbsolute(raw)) tries = [raw];
  else {
    const main = typeof process !== 'undefined' && process.argv?.[1] ? path.dirname(path.resolve(process.argv[1])) : null;
    tries = [...new Set([main && path.resolve(main, raw), path.resolve(process.cwd(), raw)].filter(Boolean))];
  }
  // 'cogs/fun' works too: try .js and .mjs.
  const found = tries.flatMap((p) => (/\.m?js$/i.test(p) ? [p] : [p, `${p}.js`, `${p}.mjs`])).find((p) => fs.existsSync(p));
  if (!found) throw new Error(`Can't find ${raw} (looked at ${tries.join(' and ')})`);
  const rel = path.relative(process.cwd(), found);
  const label = (rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : found).split(path.sep).join('/');
  return { abs: found, url: pathToFileURL(found).href, label };
}

export class Bot {
  /**
   * @param {string} token from Settings → Developer
   * @param {{ base?: string, gateway?: string | false, prefixes?: string[], log?: boolean, ignoreBots?: boolean }} [opts]
   *   `ignoreBots` (default true): skip messages from other bots and webhooks (`msg.author_bot`), so two bots can't
   *   reply to each other forever. Pass false to get them too.
   *   `gateway`: where events come from over a WebSocket (default wss://rt.yapper.website/bot). Used when the runtime
   *   has WebSocket built in (Node 22+, Bun, Deno) and the gateway is on for this bot; otherwise, or if the socket
   *   keeps failing, events come from the long poll as before. Pass false to always long-poll.
   */
  constructor(token, opts = {}) {
    if (!token || !String(token).startsWith('yb_')) throw new Error('Pass your bot token (starts with yb_). Get one in Settings → Developer.');
    this.token = String(token).trim();
    this.base = (opts.base || 'https://www.yapin.gg/api/bot/v1').replace(/\/$/, '');
    this.gateway = opts.gateway === false || typeof globalThis.WebSocket !== 'function' ? null : (opts.gateway || 'wss://rt.yapper.website/bot');
    this.prefixes = opts.prefixes || ['/', '!'];
    this.log = opts.log !== false;
    this.ignoreBots = opts.ignoreBots !== false;
    this.handlers = {};
    this.commands = new Map();
    this.buttons = [];
    this.last = 0;
    this.running = false;
    this.me = null;
    /** Loaded cogs by name ('fun' for cogs/fun.js). */
    this.cogs = new Map();
    this._pending = new Set();
    this._registered = false;
    this._dirty = false;
    this._syncTimer = null;
    this._version = 0;
    this._ws = null;
  }

  /** Listen for an event: "message", "member_join", "member_leave", "reaction_add", "reaction_remove", "voice_join", "voice_leave", "interaction", "test", "ready", "error". */
  on(event, fn) { (this.handlers[event] ||= []).push(fn); return this; }

  /** Register a command. People type /name or !name; the composer suggests it. */
  command(name, description, fn) { return this.#addCommand(name, description, fn, null, null); }

  #addCommand(name, description, fn, owner, check) {
    if (typeof description === 'function') { fn = description; description = ''; }
    const n = String(name).toLowerCase().replace(/^[/!]/, '');
    if (!/^[a-z0-9_-]{1,32}$/.test(n)) throw new Error(`Bad command name "${name}": letters, numbers, - and _ only`);
    if (typeof fn !== 'function') throw new Error(`Command /${n} needs a function to run`);
    const old = this.commands.get(n);
    // Same name twice in the main file just replaces it (as it always did). Across cogs that's a mistake: say where.
    if (old && old.owner !== owner && (old.owner || owner)) {
      const where = (o) => (o ? o.label : 'your main file');
      throw new Error(`Command /${n} is in both ${where(old.owner)} and ${where(owner)}. Rename one of them.`);
    }
    if (!old && this.commands.size >= COMMAND_LIMIT) throw new Error(`Up to ${COMMAND_LIMIT} commands per bot, /${n} is one too many`);
    this.commands.set(n, { description: String(description || '').slice(0, 100), fn, owner, check });
    if (owner) owner.cmds.add(n);
    this.#syncSoon();
    return this;
  }

  /**
   * Handle clicks on buttons with this custom_id (a string, or a RegExp like /^vote:/).
   * `fn(i)` gets the click: i.custom_id, i.user_id, i.username, i.message_id, i.channel_id and
   * i.reply(text, opts) / i.ephemeral(text, opts) / i.update({ content, embeds, components }) / i.ack().
   * Answer within 3 seconds or the person sees "This interaction failed"; you then have 15 minutes for more answers.
   */
  onButton(customId, fn) { this.buttons.push({ match: customId, fn, owner: null }); return this; }

  // ---- cogs: split a bot into files ----
  /**
   * Load a cog file: `await bot.load('./cogs/fun.js')`. The path is relative to your main file (or the folder
   * you run node in), or a URL like `new URL('./cogs/fun.js', import.meta.url)`. The file either has
   * `export default function setup(bot) { bot.command(…) }` (or `export function setup(bot)`), or exports
   * Cog classes (`export class Fun extends Cog { … }`), which are made for you. Its name is the file name: 'fun'.
   * Loaded after start()? Its commands are sent to Yapin’ a second later.
   */
  load(file) { return this.#track(this.#loadFile(file, 0)); }

  /** Load every .js / .mjs file in a folder, A to Z. Files starting with _ are skipped (handy for helpers). Returns the names. */
  loadCogs(dir = './cogs') {
    return this.#track((async () => {
      const { abs } = await locate(dir);
      const [fs, path] = await Promise.all([import('node:fs/promises'), import('node:path')]);
      const files = (await fs.readdir(abs, { withFileTypes: true }))
        .filter((d) => d.isFile() && /\.m?js$/i.test(d.name) && !/^[_.]/.test(d.name))
        .map((d) => d.name).sort();
      const names = [];
      for (const f of files) names.push(await this.#loadFile(path.join(abs, f), 0));
      return names;
    })());
  }

  /** Add a cog made in code: `await bot.addCog(new Fun(bot))` or `bot.addCog(Fun)`. Its name is its class name. */
  addCog(cog) {
    return this.#track((async () => {
      const owner = this.#owner(null, null);
      if (isCogClass(cog)) cog = new cog(this.#scoped(owner));
      if (!cog || typeof cog !== 'object') throw new Error('addCog needs a cog, like bot.addCog(new Fun(bot))');
      owner.name = String((typeof cog.name === 'string' && cog.name) || cog.constructor?.name || 'cog');
      owner.label = `cog ${owner.name}`;
      if (this.cogs.has(owner.name)) throw new Error(`A cog called "${owner.name}" is already loaded`);
      this.cogs.set(owner.name, owner);
      try { await this.#mountCog(owner, cog); } catch (e) { this.#drop(owner); this.cogs.delete(owner.name); throw e; }
      this.#syncSoon();
      return cog;
    })());
  }

  /** Take a cog out again: its commands, buttons and listeners are gone, and cogUnload() runs. `bot.unload('fun')`. */
  async unload(name) {
    const owner = this.#findCog(name);
    this.cogs.delete(owner.name);
    await this.#teardown(owner);
    this.#drop(owner);
    this.#syncSoon();
    return owner.name;
  }

  /**
   * Unload a cog and load its file again, fresh from disk: edit cogs/fun.js, then `await bot.reload('fun')`, no restart.
   * If the new version fails to load, the old one is put back and the error is thrown.
   * (Files the cog imports itself are not re-read; restart for those.)
   */
  async reload(name) {
    const owner = this.#findCog(name);
    if (!owner.file) throw new Error(`"${owner.name}" wasn't loaded from a file, so it can't be reloaded`);
    await this.unload(owner.name);
    try { return await this.#loadFile(owner.file, ++this._version); } catch (e) {
      await this.#loadFile(owner.file, owner.version).catch(() => {});
      throw e;
    }
  }

  #track(p) {
    this._pending.add(p);
    const done = () => this._pending.delete(p);
    p.then(done, done);
    return p;
  }

  #findCog(name) {
    const key = String(name ?? '');
    const owner = this.cogs.get(key) || this.cogs.get(key.replace(/^.*[\\/]/, '').replace(/\.m?js$/i, ''));
    if (!owner) throw new Error(`No cog called "${key}" is loaded${this.cogs.size ? ` (loaded: ${[...this.cogs.keys()].join(', ')})` : ''}`);
    return owner;
  }

  #owner(name, file) {
    return { name, file, label: name, version: 0, cmds: new Set(), evs: [], instances: [], check: null, teardown: null };
  }

  async #loadFile(file, version) {
    const { abs, url, label } = await locate(file);
    const name = label.replace(/^.*\//, '').replace(/\.m?js$/i, '');
    if (this.cogs.has(name)) throw new Error(`A cog called "${name}" is already loaded (${this.cogs.get(name).label}). To load it again: bot.reload('${name}')`);
    const owner = this.#owner(name, abs);
    owner.label = label;
    owner.version = version;
    this.cogs.set(name, owner);
    try {
      const mod = await import(version ? `${url}?v=${version}` : url);
      const setup = typeof mod.setup === 'function' ? mod.setup : typeof mod.default === 'function' && !isCogClass(mod.default) ? mod.default : null;
      if (setup) {
        if (typeof mod.check === 'function') owner.check = tagged(owner, mod.check, undefined, 'check');
        if (typeof mod.teardown === 'function') owner.teardown = mod.teardown;
        await setup(this.#scoped(owner));
      } else {
        const classes = [...new Set(Object.values(mod))].filter(isCogClass);
        if (!classes.length) throw new Error('it has no setup(bot) function and no Cog class. Add one of them');
        for (const C of classes) await this.#mountCog(owner, new C(this.#scoped(owner)));
      }
    } catch (e) {
      this.#drop(owner);
      this.cogs.delete(name);
      const err = new Error(`Couldn't load ${label}: ${e?.message || e}`, { cause: e });
      if (e?.stack) err.stack = `${err.message}\n${String(e.stack).split('\n').slice(1).join('\n')}`;
      throw err;
    }
    this.#syncSoon();
    if (this.log && this.running) console.log(`[yapper] loaded ${name}`);
    return name;
  }

  /** Registers what a Cog instance declares: commands, buttons, on, check, then runs cogLoad(). */
  async #mountCog(owner, cog) {
    if (!cog.bot || cog.bot === this) cog.bot = this.#scoped(owner);
    const check = typeof cog.check === 'function' ? tagged(owner, cog.check, cog, 'check') : null;
    for (const [n, c] of Object.entries(cog.commands || {})) {
      const run = typeof c === 'function' ? c : c?.run;
      if (typeof run !== 'function') throw new Error(`command "${n}" needs a run function: { description: '…', run: (msg) => … }`);
      this.#addCommand(n, typeof c === 'function' ? '' : c.description, tagged(owner, run, cog, `/${n}`), owner, check);
    }
    for (const [prefix, fn] of Object.entries(cog.buttons || {})) {
      if (typeof fn !== 'function') throw new Error(`button "${prefix}" needs a function`);
      // The key is the start of the custom_id: 'vote:' matches 'vote:yes' and 'vote:no'.
      const match = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      this.buttons.push({ match, fn: tagged(owner, fn, cog, `button ${prefix}`), owner });
    }
    for (const [event, fns] of Object.entries(cog.on || {})) {
      for (const fn of [].concat(fns)) {
        if (typeof fn !== 'function') throw new Error(`on.${event} needs a function`);
        const w = tagged(owner, fn, cog, event);
        this.on(event, w);
        owner.evs.push([event, w]);
      }
    }
    owner.instances.push(cog);
    if (typeof cog.cogLoad === 'function') await cog.cogLoad();
  }

  /**
   * The bot a cog's setup gets: the real bot, except command / on / onButton remember which cog added them
   * (so unload can take them out and errors say which cog broke).
   */
  #scoped(owner) {
    const bot = this;
    let proxy;
    const own = {
      command(name, description, fn) {
        if (typeof description === 'function') { fn = description; description = ''; }
        bot.#addCommand(name, description, typeof fn === 'function' ? tagged(owner, fn, undefined, `/${String(name).replace(/^[/!]/, '')}`) : fn, owner, owner.check);
        return proxy;
      },
      on(event, fn) {
        const w = tagged(owner, fn, undefined, event);
        bot.on(event, w);
        owner.evs.push([event, w]);
        return proxy;
      },
      onButton(customId, fn) {
        bot.buttons.push({ match: customId, fn: tagged(owner, fn, undefined, `button ${customId}`), owner });
        return proxy;
      },
    };
    proxy = new Proxy(bot, {
      get(t, k) {
        if (Object.hasOwn(own, k)) return own[k];
        const v = Reflect.get(t, k);
        return typeof v === 'function' && k !== 'constructor' ? v.bind(t) : v;
      },
    });
    return proxy;
  }

  async #teardown(owner) {
    const hooks = owner.instances.filter((c) => typeof c.cogUnload === 'function').map((c) => () => c.cogUnload());
    if (owner.teardown) hooks.push(() => owner.teardown(this.#scoped(owner)));
    for (const h of hooks) { try { await h(); } catch (e) { await this.fail(tagError(e, owner, 'unload')); } }
  }

  /** Removes everything a cog registered. New arrays, so an event being handled right now isn't disturbed. */
  #drop(owner) {
    for (const n of owner.cmds) if (this.commands.get(n)?.owner === owner) this.commands.delete(n);
    this.buttons = this.buttons.filter((b) => b.owner !== owner);
    for (const [event, fn] of owner.evs) if (this.handlers[event]) this.handlers[event] = this.handlers[event].filter((f) => f !== fn);
    owner.cmds.clear();
    owner.evs = [];
  }

  #commandList() { return [...this.commands].map(([name, c]) => ({ name, description: c.description })); }

  /** Commands changed after start(): send the new list to Yapin’ once things settle (a second later). */
  #syncSoon() {
    if (!this.running) return;
    if (!this._registered) { this._dirty = true; return; }
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._syncTimer = null;
      const commands = this.#commandList();
      this.api('PUT', '/commands', { commands }).then(
        () => { if (this.log) console.log(`[yapper] commands updated (${commands.length})`); },
        (e) => this.fail(e),
      );
    }, 1000);
  }

  /**
   * Raw API call. `api('GET', '/servers')`, `api('POST', '/channels/<id>/messages', { content: 'hi' })`.
   * A 429 that says how long to wait (Retry-After), or a 503 "Yapin’ is busy", is waited out and retried,
   * up to 3 times (nothing was sent, so that's safe). Other errors throw an Error with `.status` (and `.retryAfter` in seconds on 429).
   */
  async api(method, path, body, { timeout = 30_000, retries = 3 } = {}) {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(this.base + path, {
        method,
        headers: { authorization: `Bot ${this.token}`, 'content-type': 'application/json', 'user-agent': 'yapper-sdk/1' },
        body: body === undefined ? undefined : JSON.stringify(body),
        // A dead connection shouldn't hang the bot forever.
        signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined,
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok) return out;
      // 429: slow down. 503 with retry_after: Yapin’ was busy and nothing was done, so retrying is safe too.
      const busy = res.status === 503 && typeof out.retry_after === 'number';
      const wait = res.status === 429 || busy ? Number(res.headers.get('retry-after')) || out.retry_after || 0 : 0;
      if (wait > 0 && wait <= 60 && attempt < retries) {
        if (this.log) console.warn(`[yapper] ${busy ? 'Yapin’ busy' : 'rate limited'}, retrying ${method} ${path} in ${wait}s`);
        await sleep(wait * 1000 * (1 + Math.random() * 0.5));  // jitter: bots don't all come back at once
        continue;
      }
      const err = new Error(out.error || `${method} ${path} failed (${res.status})`);
      err.status = res.status;
      if (wait) err.retryAfter = wait;
      throw err;
    }
  }

  /**
   * Send a message to a channel. Returns the message.
   * `opts.embeds`: up to 5 cards (plain objects or `new Embed()`), content can be '' then. `opts.replyTo`: a message id.
   * `opts.components`: up to 5 rows of up to 5 buttons (`new Row(Button.primary('Go', 'go'))`).
   */
  send(channelId, content, opts = {}) {
    return this.#soft(this.api('POST', `/channels/${channelId}/messages`, { content: String(content ?? ''), reply_to: opts.replyTo, embeds: list(opts.embeds || undefined), components: list(opts.components || undefined) }).then((out) => out.message));
  }
  /**
   * Send a Components V2 message (layout components, flags 32768): the layout is the whole message, no content
   * or embeds. `bot.sendLayout(ch, [new Container().accent('blue').text('# Hi').add(new Row(Button.primary('Go', 'go')))])`.
   * Limits: 40 components (nested ones count), 4000 characters of text in all, galleries of 1 to 10.
   */
  sendLayout(channelId, components, opts = {}) {
    return this.#soft(this.api('POST', `/channels/${channelId}/messages`, { flags: IS_COMPONENTS_V2, reply_to: opts.replyTo, components: list(components) }).then((out) => out.message));
  }
  /** Send just a card: `bot.sendEmbed(ch, new Embed().title('Hi'))`. */
  sendEmbed(channelId, embed, content = '') { return this.send(channelId, content, { embeds: [].concat(embed) }); }
  /** Delete a message: the bot's own, or anyone's if its roles have Manage messages. */
  async delete(channelId, messageId) { return this.api('DELETE', `/channels/${channelId}/messages/${messageId}`); }
  /** Servers the bot is in. */
  async servers() { return (await this.api('GET', '/servers')).servers; }
  /**
   * Channels of a server the bot can see (private ones only if it was let in), in sidebar order:
   * { id, name, type: 'text'|'voice', category: { id, name, position } | null, position, private, read_only, slowmode }.
   * `channels(serverId, { type: 'text' })` for one kind. Without a server id: every channel in every server the bot is in.
   */
  async channels(serverId, { type } = {}) {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return (await this.api('GET', serverId ? `/servers/${serverId}/channels${q}` : `/channels${q}`)).channels;
  }
  /** Channel categories of a server, in order: { id, name, position }. */
  async categories(serverId) { return (await this.api('GET', `/servers/${serverId}/channels`)).categories; }
  /** One channel by id (null if the bot can't see it). */
  async channel(channelId) { try { return (await this.api('GET', `/channels/${channelId}`)).channel; } catch { return null; } }
  /** Members of a server (first 200; pass `after` = last user id for more). */
  async members(serverId, after) { return (await this.api('GET', `/servers/${serverId}/members?limit=200${after ? `&after=${after}` : ''}`)).members; }
  /** Recent messages in a channel, oldest first. Each has its `author` profile ({ id, username, display_name, … }). */
  async messages(channelId, limit = 50) { return withAuthors(await this.api('GET', `/channels/${channelId}/messages?limit=${limit}`)); }
  /** Someone's public profile. */
  async user(userId) { return (await this.api('GET', `/users/${userId}`)).user; }
  /**
   * Set the bot's profile picture. Pass a file path (Node), a Blob/File, or bytes (Uint8Array/Buffer).
   * PNG, JPG, GIF or WebP, up to 8 MB. `type` is needed only for raw bytes (e.g. 'image/png').
   */
  async setAvatar(image, type) { return this.#upload('/me/avatar', image, type); }
  /** Change the bot's display name and/or bio: setProfile({ displayName: 'Dice Bot', bio: 'Rolls dice' }). */
  async setProfile({ displayName, bio } = {}) {
    return this.api('PATCH', '/me', { display_name: displayName, bio });
  }
  /** The bot's banner, same inputs as setAvatar. */
  async setBanner(image, type) { return this.#upload('/me/banner', image, type); }
  /** Online status and what the bot is "playing": setStatus('dnd', 'Moderating'). Status: online, idle, dnd. */
  async setStatus(status = 'online', activity = null) { return this.api('PUT', '/me/status', { status, activity }); }

  // ---- messages ----
  /** Edit one of the bot's own messages. `opts.embeds` / `opts.components`: new ones, or null to remove them. */
  async edit(channelId, messageId, content, opts = {}) {
    const body = {};
    if (content !== undefined && content !== null) body.content = String(content);
    if (opts.embeds !== undefined) body.embeds = list(opts.embeds);
    if (opts.components !== undefined) body.components = list(opts.components);
    return (await this.api('PATCH', `/channels/${channelId}/messages/${messageId}`, body)).message;
  }
  /** Swap the layout of one of the bot's Components V2 messages (see sendLayout). */
  async editLayout(channelId, messageId, components) {
    return (await this.api('PATCH', `/channels/${channelId}/messages/${messageId}`, { flags: IS_COMPONENTS_V2, components: list(components) })).message;
  }
  /**
   * Answer a button click (within 15 minutes). type: 'reply' (new message), 'ephemeral' (only the clicker sees it),
   * 'update' (edit the clicked message) or 'ack' (just "got it"). The `i` helpers from onButton call this for you.
   * `layout`: a Components V2 layout instead of content/embeds/components (reply and update only).
   */
  respond(interaction, type, { content, embeds, components, layout } = {}) {
    const body = { type };
    if (content !== undefined) body.content = content === null ? null : String(content);
    if (embeds !== undefined) body.embeds = list(embeds);
    if (components !== undefined) body.components = list(components);
    if (layout !== undefined) { body.flags = IS_COMPONENTS_V2; body.components = list(layout); }
    return this.#soft(this.api('POST', `/interactions/${interaction.id}/${interaction.token}/callback`, body));
  }
  /**
   * One message by id, with its `author` profile, like send() and edit() return a message.
   * (`.message` still works for bots written against the older SDK that returned the raw body.)
   */
  async message(channelId, messageId) {
    const out = await this.api('GET', `/channels/${channelId}/messages/${messageId}`);
    return out.message ? { ...out.message, author: out.author ?? null, message: out.message } : out;
  }
  /** Messages after a time (ISO string or Date), oldest first, each with its `author`. */
  async messagesAfter(channelId, after, limit = 50) { return withAuthors(await this.api('GET', `/channels/${channelId}/messages?limit=${limit}&after=${encodeURIComponent(new Date(after).toISOString())}`)); }
  /** Delete up to 100 messages at once (needs Manage messages for other people's). Returns { deleted, skipped }. */
  async bulkDelete(channelId, messageIds) { return this.api('POST', `/channels/${channelId}/messages/bulk-delete`, { ids: messageIds }); }
  async pin(channelId, messageId) { return this.api('PUT', `/channels/${channelId}/messages/${messageId}/pin`); }
  async unpin(channelId, messageId) { return this.api('DELETE', `/channels/${channelId}/messages/${messageId}/pin`); }
  react(channelId, messageId, emoji) { return this.#soft(this.api('PUT', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`)); }
  async unreact(channelId, messageId, emoji) { return this.api('DELETE', `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`); }
  async reactions(channelId, messageId) { return (await this.api('GET', `/channels/${channelId}/messages/${messageId}/reactions`)).reactions; }

  // ---- members, roles, moderation (the bot needs a role with the matching permission) ----
  async server(serverId) { return (await this.api('GET', `/servers/${serverId}`)).server; }
  async roles(serverId) { return (await this.api('GET', `/servers/${serverId}/roles`)).roles; }
  /** One member: profile, nickname, role ids, timeout. */
  async member(serverId, userId) { return (await this.api('GET', `/servers/${serverId}/members/${userId}`)).member; }
  async addRole(serverId, userId, roleId) { return this.api('PUT', `/servers/${serverId}/members/${userId}/roles/${roleId}`); }
  async removeRole(serverId, userId, roleId) { return this.api('DELETE', `/servers/${serverId}/members/${userId}/roles/${roleId}`); }
  /** Set someone's nickname ('' clears it). */
  async setNickname(serverId, userId, nickname) { return this.api('PATCH', `/servers/${serverId}/members/${userId}`, { nickname }); }
  async kick(serverId, userId) { return this.api('POST', `/servers/${serverId}/kick`, { user_id: userId }); }
  async ban(serverId, userId) { return this.api('POST', `/servers/${serverId}/bans`, { user_id: userId }); }
  async unban(serverId, userId) { return this.api('DELETE', `/servers/${serverId}/bans/${userId}`); }
  async bans(serverId) { return (await this.api('GET', `/servers/${serverId}/bans`)).bans; }
  /** Time someone out for `minutes` (0 clears it). */
  async timeout(serverId, userId, minutes, reason = '') { return this.api('POST', `/servers/${serverId}/timeouts`, { user_id: userId, minutes, reason }); }

  // ---- voice (Move Members for moves; 30 moves and 60 lookups a minute per bot) ----
  /** Who is in voice: [{ channel_id, user_ids }] for every voice channel the bot can see (empty ones too). */
  async voice(serverId) { return (await this.api('GET', `/servers/${serverId}/voice`)).voice; }
  /** Move someone who is in voice to another voice channel of the server (Move Members). */
  async moveMember(serverId, userId, channelId) { return this.api('POST', `/servers/${serverId}/voice/move`, { user_id: userId, channel_id: channelId }); }
  /** Drop someone from voice (Move Members). */
  async disconnectMember(serverId, userId) { return this.api('POST', `/servers/${serverId}/voice/disconnect`, { user_id: userId }); }

  // ---- the bot in voice: music bots (10 joins and leaves a minute; one voice channel per server) ----
  /**
   * A ticket for a voice channel: { url, token, e2ee, voice_muted, channel_id, server_id }. Connect with any LiveKit SDK
   * within a minute. The bot can send one audio track (as a mic) and hears nobody. Joining another channel of the
   * same server drops it from the first. Most bots want connectVoice below, which does all of it.
   */
  async joinVoice(serverId, channelId) { return this.api('POST', `/servers/${serverId}/voice/join`, { channel_id: channelId }); }
  /** Take the bot out of voice in that server (also works when its own code has lost track of the call). */
  async leaveVoice(serverId) { return this.api('POST', `/servers/${serverId}/voice/leave`); }
  /**
   * Join a voice channel and get an audio source to play into, with @livekit/rtc-node (npm i @livekit/rtc-node). You
   * pass the module in, so this file stays dependency free:
   *   import * as rtc from '@livekit/rtc-node';
   *   const call = await bot.connectVoice(rtc, serverId, channelId);
   *   await call.source.captureFrame(new rtc.AudioFrame(pcm, 48000, 2, 480));   // 10 ms of 16-bit stereo PCM
   *   await call.leave();
   * Returns { room, source, track, e2ee, leave() }. Calls on Yapin’ are end-to-end encrypted: this hands the bot's
   * media key to everyone in the call the way the app does (sealed to each person, the server never sees it) and
   * encrypts the audio with it. Without that nobody would hear the bot.
   */
  async connectVoice(rtc, serverId, channelId, { sampleRate = 48000, channels = 2, bitrate = 128_000 } = {}) {
    const t = await this.joinVoice(serverId, channelId);
    const subtle = (globalThis.crypto ?? (await import('node:crypto')).webcrypto).subtle;
    const mediaKey = t.e2ee ? (globalThis.crypto ?? (await import('node:crypto')).webcrypto).getRandomValues(new Uint8Array(32)) : null;
    const room = new rtc.Room();
    // Shared key mode encrypts our frames with mediaKey; HKDF (1) is how the app's browsers turn it into the frame key.
    // Deprecated `e2ee` on purpose, not `encryption`: `encryption` also encrypts data packets, which would seal the
    // key handoff below under the very key nobody has yet (track glows, no sound). Keep this until the app can read it.
    await room.connect(t.url, t.token, {
      autoSubscribe: false, dynacast: false,
      ...(mediaKey ? { e2ee: { keyProviderOptions: { sharedKey: mediaKey, ratchetWindowSize: 0, keyRingSize: 16, keyDerivationFunction: 1 } } } : {}),
    });
    const keys = mediaKey ? await handOutVoiceKey(room, subtle, mediaKey) : null;
    const source = new rtc.AudioSource(sampleRate, channels);
    const track = rtc.LocalAudioTrack.createAudioTrack('audio', source);
    const opts = new rtc.TrackPublishOptions({ source: rtc.TrackSource.SOURCE_MICROPHONE, dtx: false, audioEncoding: { maxBitrate: BigInt(bitrate) } });
    await room.localParticipant.publishTrack(track, opts);
    return { room, source, track, e2ee: !!mediaKey, leave: async () => { keys?.stop(); await room.disconnect(); } };
  }

  // ---- channels ----
  async createChannel(serverId, name, { kind = 'text', categoryId } = {}) { return (await this.api('POST', `/servers/${serverId}/channels`, { name, kind, category_id: categoryId })).channel; }
  /** Change a channel: { name, categoryId, private, roleIds, readOnly, postRoleIds, slowmode }. */
  async editChannel(channelId, changes = {}) {
    const { name, categoryId, private: priv, roleIds, readOnly, postRoleIds, slowmode } = changes;
    return (await this.api('PATCH', `/channels/${channelId}`, { name, category_id: categoryId, private: priv, role_ids: roleIds, read_only: readOnly, post_role_ids: postRoleIds, slowmode })).channel;
  }
  async deleteChannel(channelId) { return this.api('DELETE', `/channels/${channelId}`); }
  async createCategory(serverId, name) { return (await this.api('POST', `/servers/${serverId}/categories`, { name })).category; }
  async deleteCategory(serverId, categoryId) { return this.api('DELETE', `/servers/${serverId}/categories/${categoryId}`); }

  // ---- DMs ----
  /** Open a DM with someone (they must allow DMs from the bot: a friend, or sharing a server, depending on their setting). Returns the channel id; then bot.send(channelId, …). */
  async dm(userId) { return (await this.api('POST', `/users/${userId}/dm`)).channel_id; }
  /** Open a DM and send one message in it. */
  dmSend(userId, content, opts = {}) { return this.#soft(this.dm(userId).then((cid) => this.send(cid, content, opts))); }

  async #upload(path, image, type) {
    let bytes = image;
    if (typeof image === 'string') {
      const fs = await import('node:fs/promises');
      bytes = await fs.readFile(image);
      type ||= { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }[image.split('.').pop().toLowerCase()];
    } else if (typeof Blob !== 'undefined' && image instanceof Blob) {
      type ||= image.type;
      bytes = new Uint8Array(await image.arrayBuffer());
    }
    if (!type) throw new Error('Pass the image type too, like "image/png"');
    const res = await fetch(this.base + path, { method: 'PUT', headers: { authorization: `Bot ${this.token}`, 'content-type': type, 'user-agent': 'yapper-sdk/1' }, body: bytes });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { const err = new Error(out.error || `upload failed (${res.status})`); err.status = res.status; throw err; }
    return out;
  }

  /**
   * Sending is often fire-and-forget (`msg.reply('hi')` without await). If such a call fails (rate limit,
   * no permission) Node would crash on the unhandled rejection; instead the error goes to on('error') / the
   * log. Code that awaits or .catch()es the call gets the error as usual and nothing extra is reported.
   */
  #soft(p) {
    let seen = false;
    p.catch((e) => { if (!seen) void this.fail(e); });
    const use = () => { seen = true; return p; };
    return { then: (a, b) => use().then(a, b), catch: (b) => use().catch(b), finally: (f) => use().finally(f), [Symbol.toStringTag]: 'Promise' };
  }

  async emit(event, payload) {
    for (const fn of this.handlers[event] || []) {
      try { await fn(payload); } catch (e) {
        // A broken "error" listener is logged once. Sending it back to fail() made it call itself until the stack overflowed.
        if (event === 'error') { if (this.log) console.error('[yapper] error listener threw:', e?.message || e); }
        else await this.fail(e);
      }
    }
  }
  async fail(e) {
    if (this.handlers.error?.length) await this.emit('error', e);
    else if (this.log) console.error(e?.cog ? `[yapper] [${e.cog}${e.where ? ` ${e.where}` : ''}]` : '[yapper]', e?.message || e);
  }

  /** Register the commands with Yapin’ and start fetching events. Resolves when stopped. */
  async start() {
    if (this.running) return;
    this.running = true;
    // Cogs still loading (bot.load() without await) finish first, so their commands are in the list.
    if (this._pending.size) await Promise.allSettled([...this._pending]);
    if (this.log) console.log('[yapper] connecting…');
    let list = [];
    let first;
    // Startup calls retry through network blips and server hiccups too (a bad token still stops right away).
    for (let n = 1; ; n++) {
      try {
        this.me = await this.api('GET', '/me');
        this._dirty = false;
        list = this.#commandList();
        await this.api('PUT', '/commands', { commands: list });
        this._registered = true;
        // Skip events from before we started.
        first = await this.api('GET', '/events?after=0&wait=0');
        break;
      } catch (e) {
        if (e.status === 401 || e.status === 400 || e.status === 403) { this.running = false; throw e; }
        await this.fail(e);
        await sleep(backoff(n));
        if (!this.running) return;
      }
    }
    this.last = first.last || 0;
    // A cog loaded while we were connecting: send the list again.
    if (this._dirty) this.#syncSoon();
    if (this.log) console.log(`[yapper] ${this.me.username} is online${list.length ? ` with ${list.length} command${list.length === 1 ? '' : 's'}` : ''}`);
    await this.emit('ready', this.me);
    let failures = 0;
    let gwFails = 0;
    let gwRetryAt = 0;
    while (this.running) {
      // The gateway first; when it's off for this bot or keeps failing, the long poll below for a while.
      if (this.gateway && Date.now() >= gwRetryAt) {
        const r = await this.#gatewaySession();
        if (!this.running) break;
        if (r === 'bad_token') { await this.fail(new Error('Token rejected: make a new one in Settings → Developer')); this.running = false; break; }
        if (r === 'disabled') gwRetryAt = Date.now() + 10 * 60_000;
        else if (r === 'ok') { gwFails = 0; await sleep(backoff(1)); continue; }
        else if (++gwFails >= 3) {
          if (this.log) console.log('[yapper] gateway unavailable, long polling for 5 minutes');
          gwFails = 0; gwRetryAt = Date.now() + 5 * 60_000;
        } else { await sleep(backoff(gwFails)); continue; }
      }
      let out;
      try {
        // No inner retries: a failed poll already waits below, with backoff that keeps growing.
        out = await this.api('GET', `/events?after=${this.last}&wait=25`, undefined, { timeout: 45_000, retries: 0 });
        failures = 0;
      } catch (e) {
        failures++;
        if (e.status === 401) { await this.fail(new Error('Token rejected: make a new one in Settings → Developer')); this.running = false; break; }
        await this.fail(e);
        // Retry-After when the server sent one, otherwise exponential backoff (never a tight loop).
        await sleep(Math.max((e.retryAfter || 0) * 1000, backoff(failures)));
        continue;
      }
      for (const ev of out.events || []) {
        // Each event once, in order: anything at or below the cursor was already handled.
        if (!(ev.id > this.last)) continue;
        this.last = ev.id;
        await this.handle(ev);
      }
      // Also move on when there were no events (the server answers after=0 with the newest id).
      if (typeof out.last === 'number' && out.last > this.last) this.last = out.last;
    }
  }

  /**
   * One gateway connection (docs: /developers#gateway). Picks up after this.last, so nothing is missed between a
   * long poll and the socket or across reconnects. Resolves when the socket closes: 'ok' (was up a while, reconnect),
   * 'disabled' (not on for this bot: long poll), 'bad_token', or 'failed'.
   */
  #gatewaySession() {
    return new Promise((resolve) => {
      let ws;
      try { ws = new WebSocket(this.gateway); } catch { resolve('failed'); return; }
      this._ws = ws;
      let readyAt = 0;
      let beat = null;
      let acked = true;
      // Events are handled one at a time, in order, like the long poll.
      let chain = Promise.resolve();
      let over = false;
      const finish = (r) => {
        if (over) return;
        over = true;
        // Detached first: closing from inside a handler can fire "error" again right away.
        ws.onmessage = null; ws.onerror = null; ws.onclose = null;
        clearInterval(beat); clearTimeout(slow);
        if (this._ws === ws) this._ws = null;
        chain.then(() => resolve(r));
      };
      // A socket that never gets to ready (or a dead one whose close never comes) doesn't hold the bot up.
      const slow = setTimeout(() => { finish('failed'); try { ws.close(4000, 'no ready'); } catch { /* closed */ } }, 15_000);
      ws.onmessage = (m) => {
        let msg;
        try { msg = JSON.parse(typeof m.data === 'string' ? m.data : String(m.data)); } catch { return; }
        if (msg.op === 'hello') ws.send(JSON.stringify({ op: 'resume', token: this.token, seq: this.last }));
        else if (msg.op === 'ready') {
          readyAt = Date.now();
          clearTimeout(slow);
          if (this.log) console.log('[yapper] connected to the gateway');
          beat = setInterval(() => {
            // No answer to the last heartbeat: the connection is dead, start over.
            if (!acked) { finish('ok'); try { ws.close(4000, 'no heartbeat ack'); } catch { /* closed */ } return; }
            acked = false;
            ws.send(JSON.stringify({ op: 'heartbeat' }));
          }, msg.heartbeat_interval || 30_000);
        } else if (msg.op === 'heartbeat_ack') acked = true;
        else if (msg.op === 'event' && msg.d) {
          const ev = msg.d;
          chain = chain.then(async () => {
            if (!(ev.id > this.last)) return;
            this.last = ev.id;
            try { await this.handle(ev); } catch (e) { await this.fail(e); }
          });
        }
      };
      // Node's WebSocket fires only "error" (no "close") when it can't connect at all.
      ws.onerror = () => { if (!readyAt) finish('failed'); };
      ws.onclose = (e) => finish(e.code === 4004 ? 'bad_token' : e.code === 4003 ? 'disabled'
        : readyAt && Date.now() - readyAt > 10_000 ? 'ok' : 'failed');
    });
  }

  /** Stop after the current poll. */
  stop() {
    this.running = false;
    try { this._ws?.close(1000); } catch { /* already closed */ }
    this._registered = false;
    clearTimeout(this._syncTimer);
    this._syncTimer = null;
  }

  async handle(ev) {
    const data = ev.data || {};
    if (ev.type === 'message') {
      // Messages from bots and webhooks (author_bot): skipped unless the bot asked for them (ignoreBots: false).
      if (this.ignoreBots && data.author_bot) return;
      const msg = this.wrap(data);
      let name = data.command;
      let args = data.args;
      // "/fish @OtherBot": a command picked for another bot (command_for) isn't ours to answer, even if we have /fish.
      const forOther = Array.isArray(data.command_for) && !data.command_for.includes(this.me?.id);
      if (!name && !forOther) {
        // Commands typed with another prefix, or ones we didn't register. A prefix can be longer than one
        // character ('yap!'); the longest one that fits goes first so '!!' wins over '!'.
        const content = data.content || '';
        for (const p of [...this.prefixes].sort((a, b) => b.length - a.length)) {
          if (!p || !content.startsWith(p)) continue;
          const m = /^([a-z0-9_-]{1,32})(?:\s+([\s\S]*))?$/i.exec(content.slice(p.length));
          if (m && this.commands.has(m[1].toLowerCase())) { name = m[1].toLowerCase(); args = (m[2] || '').trim(); break; }
        }
      }
      if (name && this.commands.has(name)) {
        const c = this.commands.get(name);
        msg.command = name;
        msg.args = args || '';
        msg.argv = msg.args ? msg.args.split(/\s+/) : [];
        // A cog's check(msg) runs first; false (or an error) skips the command.
        let ok = true;
        if (c.check) { try { ok = (await c.check(msg)) !== false; } catch (e) { ok = false; await this.fail(e); } }
        if (ok) {
          try { await c.fn(msg); } catch (e) { await this.fail(e); }
          await this.emit('command', msg);
        }
      }
      await this.emit('message', msg);
    } else if (ev.type === 'interaction') {
      const i = this.wrapInteraction(data);
      for (const b of this.buttons) {
        // lastIndex reset: a /g or /y pattern keeps its place between tests, which made every other click miss.
        const hit = b.match instanceof RegExp ? ((b.match.lastIndex = 0), b.match.test(data.custom_id)) : b.match === data.custom_id;
        if (hit) { try { await b.fn(i); } catch (e) { await this.fail(e); } }
      }
      await this.emit('interaction', i);
    } else {
      await this.emit(ev.type, { ...data, type: ev.type });
    }
  }

  wrapInteraction(data) {
    const bot = this;
    return {
      ...data,
      /** A new message in the channel. */
      reply(content, opts = {}) { return bot.respond(data, 'reply', { content, ...opts }); },
      /** A message only the person who clicked sees. Text and embeds, no buttons. */
      ephemeral(content, opts = {}) { return bot.respond(data, 'ephemeral', { content, ...opts }); },
      /**
       * Change the message the button is on: { content, embeds, components } (left out = kept, null = removed).
       * On a Components V2 message: i.update({ layout: [ … ] }) with the whole new layout.
       */
      update(changes = {}) { return bot.respond(data, 'update', changes); },
      /** Just say "got it", so the person doesn't see an error. */
      ack() { return bot.respond(data, 'ack'); },
      /** <@id> for the person who clicked. */
      get userMention() { return `<@${data.user_id}>`; },
    };
  }

  wrap(data) {
    const bot = this;
    return {
      ...data,
      /** True when a bot or a webhook sent it. */
      author_bot: !!data.author_bot,
      /** Reply to this message (quoted). */
      reply(content, opts = {}) { return bot.send(data.channel_id, content, { ...opts, replyTo: data.id }); },
      /** Post in the same channel without quoting. */
      say(content, opts = {}) { return bot.send(data.channel_id, content, opts); },
      /** <@id> for the author, for mentioning them back. */
      get authorMention() { return `<@${data.author_id}>`; },
    };
  }
}

/**
 * A cog groups commands, buttons and listeners, usually one file per topic (cogs/fun.js, cogs/mod.js).
 * Load it with `await bot.load('./cogs/fun.js')` or a whole folder with `await bot.loadCogs('./cogs')`.
 *
 *   import { Cog } from '../yapper.js';
 *   export class Fun extends Cog {
 *     commands = {
 *       joke: { description: 'Tell a joke', run: (msg) => msg.reply('I know a UDP joke, but you might not get it') },
 *     };
 *     buttons = { 'vote:': (i) => i.ephemeral('Thanks!') };   // custom_ids starting with "vote:"
 *     on = { member_join: (ev) => console.log(ev.username, 'joined') };
 *     check(msg) { return true; }       // optional: return false to skip this cog's commands for this message
 *     cogLoad() {}                      // optional: runs when the cog is loaded
 *     cogUnload() {}                    // optional: runs on bot.unload / bot.reload (clear timers here)
 *   }
 *
 * Inside, `this.bot` is the bot. Use arrow functions (as above) or `run(msg) { … }`; both get `this` = the cog.
 */
export class Cog {
  static yapperCog = true;
  constructor(bot) { this.bot = bot; }
}

/**
 * Builds an embed card. Every setter returns the embed, so they chain:
 *   new Embed().title('Score').url('https://…').description('**3** wins').color('#57f287')
 *     .field('Kills', '12', true).field('Deaths', '4', true).thumbnail(url).footer('Season 2').timestamp()
 * Pictures must be https links to Yapin’ uploads or common image hosts (imgur, tenor, giphy, github, wikimedia, AniList, MyAnimeList…; full list on /developers).
 * Limits: title 256, description 4096, 10 fields (name 256, value 1024), 6000 characters in all.
 */
export class Embed {
  constructor(data = {}) { this.data = { ...data }; }
  title(t) { this.data.title = String(t); return this; }
  description(t) { this.data.description = String(t); return this; }
  url(u) { this.data.url = String(u); return this; }
  /** '#5865f2', 0x5865f2 or 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'grey'. */
  color(c) {
    const named = { red: 0xed4245, green: 0x57f287, blue: 0x5865f2, yellow: 0xfee75c, purple: 0x9b59b6, orange: 0xe67e22, grey: 0x95a5a6, gray: 0x95a5a6 };
    this.data.color = typeof c === 'number' ? c : named[String(c).toLowerCase()] ?? parseInt(String(c).replace('#', ''), 16);
    return this;
  }
  field(name, value, inline = false) { (this.data.fields ||= []).push({ name: String(name), value: String(value), inline: !!inline }); return this; }
  author(name, { url, icon } = {}) { this.data.author = { name: String(name), url, icon_url: icon }; return this; }
  footer(text, icon) { this.data.footer = { text: String(text), icon_url: icon }; return this; }
  thumbnail(url) { this.data.thumbnail = { url: String(url) }; return this; }
  image(url) { this.data.image = { url: String(url) }; return this; }
  timestamp(t = new Date()) { this.data.timestamp = new Date(t).toISOString(); return this; }
  toJSON() { return this.data; }
}

/**
 * A button for `components`. Shortcuts: Button.primary(label, customId), .secondary, .success, .danger, Button.link(label, url).
 *   new Row(Button.success('Yes', 'vote:yes'), Button.danger('No', 'vote:no'), Button.link('Rules', 'https://example.com'))
 * Limits: 5 rows of 5 buttons, label 80, custom_id 100 (each one different), link urls https only.
 */
export class Button {
  constructor(data = {}) { this.data = { type: 'button', style: 'secondary', ...data }; }
  static primary(label, customId) { return new Button({ style: 'primary', label, custom_id: customId }); }
  static secondary(label, customId) { return new Button({ style: 'secondary', label, custom_id: customId }); }
  static success(label, customId) { return new Button({ style: 'success', label, custom_id: customId }); }
  static danger(label, customId) { return new Button({ style: 'danger', label, custom_id: customId }); }
  static link(label, url) { return new Button({ style: 'link', label, url }); }
  style(s) { this.data.style = s; return this; }
  label(t) { this.data.label = String(t); return this; }
  /** One emoji: '🔥' or a server emoji '<:name:id>'. */
  emoji(e) { this.data.emoji = String(e); return this; }
  id(customId) { this.data.custom_id = String(customId); return this; }
  url(u) { this.data.style = 'link'; this.data.url = String(u); delete this.data.custom_id; return this; }
  disabled(on = true) { this.data.disabled = !!on; return this; }
  toJSON() { return this.data; }
}

/** A row of up to 5 buttons. Works under a normal message and inside a Components V2 layout. */
export class Row {
  constructor(...buttons) { this.buttons = buttons.flat(); }
  add(...buttons) { this.buttons.push(...buttons.flat()); return this; }
  toJSON() { return { type: 'row', components: this.buttons.map(plain) }; }
}

// ---- Components V2 (bot.sendLayout): layout components, standard JSON shape and type numbers ----
const COLORS = { red: 0xed4245, green: 0x57f287, blue: 0x5865f2, yellow: 0xfee75c, purple: 0x9b59b6, orange: 0xe67e22, grey: 0x95a5a6, gray: 0x95a5a6 };
const colorOf = (c) => (typeof c === 'number' ? c : COLORS[String(c).toLowerCase()] ?? parseInt(String(c).replace('#', ''), 16));
const textOf = (t) => (t instanceof TextDisplay ? t : new TextDisplay(t));

/** Markdown text (type 10). Mentions, links and emoji work like in messages; no HTML. */
export class TextDisplay {
  constructor(content) { this.content = String(content); }
  toJSON() { return { type: 10, content: this.content }; }
}

/** A small picture (type 11), only as a Section's accessory. */
export class Thumbnail {
  constructor(url, { description, spoiler } = {}) { this.data = { type: 11, media: { url: String(url) }, description, spoiler: spoiler || undefined }; }
  toJSON() { return this.data; }
}

/** 1 to 3 lines of text with a button or a thumbnail beside them (type 9). */
export class Section {
  constructor(...texts) { this.texts = texts.flat().map(textOf); this.side = null; }
  text(t) { this.texts.push(textOf(t)); return this; }
  /** A Button, or a Thumbnail (or just a picture url). */
  accessory(a) { this.side = typeof a === 'string' ? new Thumbnail(a) : a; return this; }
  toJSON() { return { type: 9, components: this.texts.map(plain), accessory: plain(this.side) }; }
}

/** 1 to 10 pictures or videos in a grid (type 12). */
export class MediaGallery {
  constructor(...urls) { this.items = []; for (const u of urls.flat()) this.add(u); }
  add(url, { description, spoiler } = {}) { this.items.push({ media: { url: String(url) }, description, spoiler: spoiler || undefined }); return this; }
  toJSON() { return { type: 12, items: this.items }; }
}

/** A line or empty space (type 14). `new Separator({ divider: false, spacing: 'large' })`. */
export class Separator {
  constructor({ divider = true, spacing = 'small' } = {}) { this.data = { type: 14, divider: !!divider, spacing: spacing === 'large' || spacing === 2 ? 2 : 1 }; }
  toJSON() { return this.data; }
}

/** A file to download (type 13): an https link to a Yapin’ upload or an allowed host. */
export class FileComponent {
  constructor(url, { spoiler } = {}) { this.data = { type: 13, file: { url: String(url) }, spoiler: spoiler || undefined }; }
  toJSON() { return this.data; }
}

/** A card holding other components (type 17), with an optional accent colour bar and spoiler. */
export class Container {
  constructor(...components) { this.parts = components.flat(); this.data = { type: 17 }; }
  /** '#5865f2', 0x5865f2 or 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'grey'. */
  accent(c) { this.data.accent_color = colorOf(c); return this; }
  spoiler(on = true) { this.data.spoiler = !!on; return this; }
  add(...components) { this.parts.push(...components.flat()); return this; }
  text(t) { return this.add(textOf(t)); }
  separator(opts) { return this.add(new Separator(opts)); }
  /** Plain strings become text displays. */
  toJSON() { return { ...this.data, components: this.parts.map((p) => plain(typeof p === 'string' ? new TextDisplay(p) : p)) }; }
}

export default Bot;
