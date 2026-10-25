import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BuiltinTypes,
  Client,
  ContainerBuilder,
  Permissions,
  PermissionFlags,
  createHelpCommand,
  defineModule,
  measureLayout,
} from '../src/index.js';

const clients = [];
const makeClient = (options = {}) => {
  const client = new Client({ logger: false, WebSocket: false, components: { autoAck: false }, ...options });
  clients.push(client);
  return client;
};

after(async () => {
  for (const c of clients) await c.destroy().catch(() => {});
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('each matching button handler sees its own pattern params, even after an await', async () => {
  const client = makeClient();
  const seen = {};
  client.button('shop:{item}', async (i, params) => {
    await tick();
    seen.specific = { params: i.params, arg: params };
  });
  client.button('shop:*', (i) => { seen.catchAll = i.params; });
  client.button(/^shop:(?<thing>.+)$/, async (i) => {
    await tick();
    seen.regexp = { params: i.params, match: i.match?.[0] };
  });
  const interaction = { customId: 'shop:apple', params: {}, responded: false, isExpired: () => false };
  assert.equal(client.components._handle(interaction), 3);
  await tick();
  await tick();
  assert.deepEqual(seen.specific, { params: { item: 'apple' }, arg: { item: 'apple' } });
  assert.deepEqual(seen.catchAll, {});
  assert.deepEqual(seen.regexp, { params: { thing: 'apple' }, match: 'shop:apple' });

  // A single match still sets params on the interaction itself.
  const one = { customId: 'shop:pear', params: {}, responded: false, isExpired: () => false };
  makeClient().components.button('shop:{item}', () => {});
  const solo = clients.at(-1);
  solo.components._handle(one);
  assert.deepEqual(one.params, { item: 'pear' });
});

test('a channel option finds a channel by name when the cache only holds the current channel', async () => {
  const client = makeClient();
  let fetches = 0;
  client.rest.get = async () => {
    fetches++;
    return { channels: [{ id: 'c1', name: 'general', server_id: 's1', type: 'text' }, { id: 'c2', name: 'bot-commands', server_id: 's1', type: 'text' }] };
  };
  client.channels._add({ id: 'c1', name: 'general', server_id: 's1', type: 'text' });
  const server = client.servers._ensure('s1');
  assert.equal(server.channels.cache.size, 1);
  const ctx = { client, server };
  const option = { name: 'channel' };

  assert.equal((await BuiltinTypes.channel.resolve('general', ctx, option)).id, 'c1');
  assert.equal(fetches, 0, 'a cached name needs no fetch');
  assert.equal((await BuiltinTypes.channel.resolve('#bot-commands', ctx, option)).id, 'c2');
  assert.equal(fetches, 1);
  await assert.rejects(BuiltinTypes.channel.resolve('nope', ctx, option), /can't find that channel/);
  assert.equal(fetches, 1, 'a typo right after a full fetch does not fetch again');
});

test('measureLayout counts text in builders the same as in JSON', () => {
  const card = new ContainerBuilder().add('hello', 'world');
  assert.deepEqual(measureLayout([card]), { count: 3, text: 10 });
  assert.deepEqual(measureLayout([card.toJSON()]), { count: 3, text: 10 });
});

test('/help names categories past the 10-field limit and lists one on request', () => {
  const registry = new Map();
  for (let n = 0; n < 12; n++) {
    const name = `cmd${n}`;
    registry.set(name, { name, description: `does ${n}`, category: `Cat${String(n).padStart(2, '0')}`, hidden: false });
  }
  const handler = { registry, get: (name) => registry.get(name) ?? null };
  const help = createHelpCommand(handler);
  const run = (command) => help.run({ prefix: '!', values: { command }, reply: (x) => x });

  const fields = run(undefined).embeds[0].toJSON().fields;
  assert.equal(fields.length, 10);
  assert.equal(fields[9].name, 'More categories');
  assert.match(fields[9].value, /`Cat09`, `Cat10`, `Cat11`/);

  const one = run('cat11').embeds[0].toJSON();
  assert.equal(one.title, 'Cat11');
  assert.match(one.description, /`!cmd11` does 11/);
  assert.match(run('nothing'), /no `!nothing` command/);
});

test('Permissions.toArray lists every flag for the server owner', () => {
  const owner = Permissions.fromRoles([], { owner: true });
  assert.equal(owner.toArray().length, Object.keys(PermissionFlags).length);
  assert.ok(owner.toArray().includes('kickmembers'));
  assert.deepEqual(Permissions.fromRoles([]).toArray(), []);
});

test('defineModule handlers have this.client, this.logger and the context helpers', async () => {
  const client = makeClient();
  const seen = {};
  const definition = defineModule({
    name: 'thisy',
    count: 0,
    events: {
      ping() {
        seen.client = this.client;
        seen.logger = typeof this.logger.info;
        this.count++;
      },
    },
    setup() {
      seen.setupHelpers = typeof this.setInterval === 'function' && this.context.name === 'thisy';
    },
    teardown() {
      seen.teardownClient = this.client;
    },
  });
  await client.modules.add(definition);
  client.emit('ping');
  assert.equal(seen.client, client);
  assert.equal(seen.logger, 'function');
  assert.equal(seen.setupHelpers, true);
  assert.equal(definition.count, 1, 'writes to this still land on the definition');
  assert.equal('client' in definition, false, 'the definition itself is left alone');
  await client.modules.unload('thisy');
  assert.equal(seen.teardownClient, client);
});
