import { tagError } from '../errors/index.js';
import { Events } from '../util/Constants.js';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A custom_id pattern → a matcher returning params (or null).
 * - 'vote:yes'          exactly that
 * - 'vote:*'            anything starting with 'vote:'
 * - 'vote:{choice}'     named parts: i.params.choice ('vote:yes' → 'yes')
 * - /^vote:(?<choice>\w+)$/   a RegExp; named groups become params
 */
export function compilePattern(pattern) {
  if (pattern instanceof RegExp) {
    return (id) => {
      pattern.lastIndex = 0;
      const m = pattern.exec(id);
      return m ? { ...(m.groups ?? {}), _match: m } : null;
    };
  }
  const text = String(pattern);
  if (!/[{*]/.test(text)) return (id) => (id === text ? {} : null);
  const names = [];
  const source = text.split(/(\{\w+\}|\*$)/).map((part) => {
    if (part === '*') return '.*';
    const m = /^\{(\w+)\}$/.exec(part);
    if (m) {
      names.push(m[1]);
      return '(.+?)';
    }
    return escapeRegExp(part);
  }).join('');
  const re = new RegExp(`^${source}$`);
  return (id) => {
    const m = re.exec(id);
    if (!m) return null;
    return Object.fromEntries(names.map((name, i) => [name, m[i + 1]]));
  };
}

/**
 * The interaction as one route's handler sees it when several routes matched: its own `params`
 * and `match` (still its own after an await), everything else shared. Methods run on the real
 * interaction, since it keeps its state in #private fields.
 */
function withParams(interaction, params, match) {
  const own = { params, match: match ?? interaction.match };
  return new Proxy(interaction, {
    get(target, key) {
      if (Object.hasOwn(own, key)) return own[key];
      const value = Reflect.get(target, key, target);
      return typeof value === 'function' && key !== 'constructor' ? value.bind(target) : value;
    },
    set(target, key, value) {
      if (Object.hasOwn(own, key)) own[key] = value;
      else Reflect.set(target, key, value);
      return true;
    },
  });
}

/**
 * `client.components`: routes button clicks to handlers by custom_id.
 *
 *   client.components.button('vote:{choice}', (i) => i.ephemeral(`You picked ${i.params.choice}`));
 *
 * Every matching handler runs, in the order added, and each sees its own pattern's `i.params`
 * (also passed as the second argument). A click nobody answers within ~2.5 s is
 * acknowledged for you (`components: { autoAck: false }` turns that off).
 */
export class ComponentRouter {
  constructor(client) {
    Object.defineProperty(this, 'client', { value: client });
    this.routes = [];
  }

  /** Returns a function that removes the handler again. */
  button(pattern, handler, { owner = null, once = false } = {}) {
    if (typeof handler !== 'function') throw new TypeError(`button(${pattern}) needs a handler function`);
    const route = { pattern, match: compilePattern(pattern), handler, owner, once };
    this.routes.push(route);
    return () => this.remove(route);
  }

  /** Same as button(); reads better for anything clickable. */
  on(pattern, handler, options) {
    return this.button(pattern, handler, options);
  }

  once(pattern, handler, options) {
    return this.button(pattern, handler, { ...options, once: true });
  }

  remove(routeOrHandler) {
    this.routes = this.routes.filter((r) => r !== routeOrHandler && r.handler !== routeOrHandler);
  }

  _removeOwner(owner) {
    this.routes = this.routes.filter((r) => r.owner !== owner);
  }

  /** Runs the handlers for one click. Returns how many matched. */
  _handle(interaction) {
    const hits = [];
    for (const route of this.routes) {
      const params = route.match(interaction.customId ?? '');
      if (params) hits.push([route, params]);
    }
    for (const [route, { _match, ...named }] of hits) {
      if (route.once) this.remove(route);
      let view = interaction;
      if (hits.length === 1) {
        interaction.params = named;
        if (_match) interaction.match = _match;
      } else {
        view = withParams(interaction, named, _match);
      }
      Promise.resolve()
        .then(() => route.handler(view, named))
        .catch((error) => {
          tagError(error, { module: route.owner?.name, where: `button ${route.pattern}` });
          this.client._reportError(error);
        });
    }
    this.#autoAck(interaction, hits.length);
    return hits.length;
  }

  #autoAck(interaction, matched) {
    const { autoAck, autoAckAfter } = this.client.options.components;
    if (autoAck === false) return;
    if (!matched && !this.client.listenerCount(Events.InteractionCreate)) {
      this.client.emit(Events.Debug, `[components] no handler for "${interaction.customId}"`);
    }
    const timer = setTimeout(() => {
      if (interaction.responded || interaction.isExpired()) return;
      this.client.emit(Events.Debug, `[components] auto-acknowledged "${interaction.customId}"`);
      interaction.deferUpdate().catch(() => {});
    }, autoAckAfter);
    timer.unref?.();
  }
}
