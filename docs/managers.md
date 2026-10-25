# Managers and caching

Every kind of thing has a manager. A manager has a `cache` (a [Collection](utilities.md#collection)) of what the bot has seen, plus `fetch()` to ask Yapin’ for more and methods for actions.

```js
client.servers.cache.get(id);              // instant, maybe undefined
await client.servers.fetch(id);            // from cache when complete, otherwise from Yapin’
await client.servers.fetch(id, { force: true }); // always from Yapin’
```

## What gets cached

| Cache | Filled by | Limit |
| --- | --- | --- |
| `client.users` | every author, member, mention and fetch | `cache.users` (unlimited) |
| `client.servers` | events and `fetch()` | unlimited |
| `client.channels` | events and fetches (a channel is also in its `server.channels`) | unlimited |
| `channel.messages` | incoming, sent and fetched messages | `cache.messages` per channel (100) |
| `server.members` | joins, authors and fetches | `cache.members` (unlimited) |
| `server.roles` | `fetch()` / `ensure()` | |
| `server.voice.states` | voice events and `server.voice.fetch()` | |

Events carry ids, so the first thing you see of a channel or server may be a partial. A channel from a message knows its id, name and server; a server from an event knows only its id. Call `fetch()` when you need the rest.

## client.servers

```js
const servers = await client.servers.fetch();   // every server the bot is in
const server = await client.servers.fetch(id);
```

## client.channels

```js
await client.channels.fetch(id);                   // one channel (404 YapinAPIError if the bot can't see it)
await client.channels.fetchAll({ type: 'text' });  // every channel in every server
await client.channels.send(id, 'hi');              // send without fetching (also client.send)
```

## client.users

```js
const user = await client.users.fetch(id);         // public profile
const dm = await client.users.createDM(id);        // DMChannel
await client.users.send(id, 'hello!');             // open the DM and send
```

## server.channels

```js
const all = await server.channels.fetch();               // channels and categories, in sidebar order
const text = await server.channels.fetch({ type: 'text' });
server.channels.categories;                              // Collection of CategoryChannel
server.channels.findByName('general');                  // from cache
await server.channels.ensure();                          // fetch() unless done in the last minute

const category = await server.channels.createCategory('Games');
const room = await server.channels.create('minecraft', { type: 'voice', category });
await server.channels.delete(room);
```

Private channels show only if the bot (or one of its roles) was let in. Servers can make up to 10 channels a minute.

## server.members

```js
const member = await server.members.fetch(userId);      // with roles, nickname, timeout
const everyone = await server.members.fetch();          // pages through all of them, 500 at a time
const page = await server.members.list({ limit: 200, after: lastId });

for await (const member of server.members.iterate()) {  // stream big servers page by page
  …
}

server.members.search('alice');                          // cached members whose username, display name or nickname is exactly this (any case)
await server.members.kick(userId);
await server.members.timeout(userId, '30m', 'spam');
await server.members.setNickname(userId, 'New name');
await server.members.addRole(userId, roleId);
const me = await server.members.fetchMe();               // the bot's own member
```

## server.roles

```js
const roles = await server.roles.fetch();     // every role, highest first
await server.roles.ensure();                  // fetch unless fetched in the last minute
server.roles.resolve('Moderator');            // by id, Role or name
server.roles.highest;
```

## server.bans

```js
const bans = await server.bans.fetch();       // Collection<userId, Ban>
await server.bans.create(userId);
await server.bans.remove(userId);
```

## channel.messages

```js
const recent = await channel.messages.fetch();                       // 50, oldest first
const older = await channel.messages.fetch({ limit: 100, before: recent.first() });
const since = await channel.messages.fetch({ after: new Date(Date.now() - 3_600_000) });
const one = await channel.messages.fetch(messageId);

await channel.messages.edit(messageId, 'new text');
await channel.messages.delete(messageId);
await channel.bulkDelete(20);                                         // the latest 20
await channel.bulkDelete(messages.filter((m) => m.author.id === spammer)); // returns { deleted, skipped }
```

`before` and `after` are times: a Date, an ISO string, or a Message (its creation time).

## Writing your own

Managers are plain classes (`CachedManager` and friends are exported), so you can extend them. Every action is also one `client.rest` call away; see [REST](rest.md).
