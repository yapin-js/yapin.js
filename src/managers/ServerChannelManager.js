import { Routes } from '../rest/Routes.js';
import { ChannelType } from '../util/Constants.js';
import { Collection } from '../util/Collection.js';
import { resolveId } from '../util/util.js';

/** `server.channels`: the server's channels and categories the bot can see, in sidebar order once fetched. */
export class ServerChannelManager {
  constructor(server) {
    Object.defineProperty(this, 'server', { value: server });
    Object.defineProperty(this, 'client', { value: server.client });
    this.cache = new Collection();
    this.fetchedAt = 0;
  }

  get categories() {
    return this.cache.filter((c) => c.type === ChannelType.Category);
  }

  /**
   * fetch() → every channel and category (sorted by position). fetch({ type: 'text' }) for one kind.
   * fetch(id) → one channel.
   */
  async fetch(idOrOptions, { force = false } = {}) {
    if (typeof idOrOptions === 'string' || (idOrOptions && 'id' in idOrOptions)) {
      const id = resolveId(idOrOptions);
      const cached = this.cache.get(id);
      if (!force && cached && !cached.partial) return cached;
      if (cached?.type === ChannelType.Category) return (await this.fetch()).get(id);
      return this.client.channels.fetch(id, { force: true });
    }
    const type = idOrOptions?.type;
    const out = await this.client.rest.get(Routes.serverChannels(this.server.id), { query: { type } });
    const found = new Collection();
    for (const category of out.categories ?? []) {
      const made = this.client.channels._add({ ...category, type: ChannelType.Category, server_id: this.server.id });
      if (!type) found.set(made.id, made);
    }
    for (const data of out.channels ?? []) {
      const made = this.client.channels._add({ ...data, server_id: data.server_id ?? this.server.id });
      found.set(made.id, made);
    }
    if (!type) this.fetchedAt = Date.now();
    this.cache.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return found.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  /**
   * Fetches every channel unless that was done in the last `maxAge` ms. Messages add their own
   * channel to the cache, so a non-empty cache doesn't mean the list is complete.
   */
  async ensure(maxAge = 60_000) {
    if (Date.now() - this.fetchedAt > maxAge) await this.fetch();
    return this.cache;
  }

  /** create('general') or create('Music', { type: 'voice', category }). Needs Manage channels. */
  async create(name, { type = ChannelType.Text, category, parent } = {}) {
    if (typeof name === 'object') return this.create(name.name, name);
    const out = await this.client.rest.post(Routes.serverChannels(this.server.id), {
      body: { name, kind: type, category_id: resolveId(category ?? parent) ?? undefined },
    });
    return this.client.channels._add({ ...out.channel, type: out.channel.kind ?? type, server_id: this.server.id });
  }

  async createCategory(name) {
    const out = await this.client.rest.post(Routes.serverCategories(this.server.id), { body: { name } });
    return this.client.channels._add({ ...out.category, type: ChannelType.Category, server_id: this.server.id });
  }

  async delete(channel) {
    const resolved = this.cache.get(resolveId(channel));
    if (resolved) return resolved.delete();
    await this.client.rest.delete(Routes.channel(resolveId(channel)));
    return null;
  }

  /** A channel by exact name (case-insensitive), from cache. */
  findByName(name, type) {
    const wanted = String(name).toLowerCase().replace(/^#/, '');
    return this.cache.find((c) => c.name?.toLowerCase() === wanted && (!type || c.type === type)) ?? null;
  }
}
