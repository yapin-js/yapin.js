# Gestionnaires et mise en cache

Chaque sorte de chose a un gestionnaire. Un manager dispose d'un `cache` (une [Collection](utilities.md#collection)) de ce que le bot a vu, plus un `fetch()` pour demander plus à Yapin' et des méthodes d'action.

```js
client.servers.cache.get(id);              // instant, maybe undefined
await client.servers.fetch(id);            // from cache when complete, otherwise from Yapin’
await client.servers.fetch(id, { force: true }); // always from Yapin’
```

## Ce qui est mis en cache

| Cache | Rempli par | Limite |
| --- | --- | --- |
| `client.users` | chaque auteur, membre, mentionne et récupère | `cache.users` (illimité) |
| `client.servers` | événements et `fetch()` | illimité |
| `client.channels` | événements et récupérations (une chaîne est également dans son `server.channels`) | illimité |
| `channel.messages` | messages entrants, envoyés et récupérés | `cache.messages` par canal (100) |
| `server.members` | jointures, auteurs et récupérations | `cache.members` (illimité) |
| `server.roles` | `fetch()` / `ensure()` | |
| `server.voice.states` | événements vocaux et `server.voice.fetch()` | |

Les événements portent des identifiants, donc la première chose que vous voyez d'un canal ou d'un serveur peut être partielle. Un canal d'un message connaît son identifiant, son nom et son serveur ; un serveur d'un événement ne connaît que son identifiant. Appelez `fetch()` lorsque vous avez besoin de repos.

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
server.channels.findByName('general');

const category = await server.channels.createCategory('Games');
const room = await server.channels.create('minecraft', { type: 'voice', category });
await server.channels.delete(room);
```

Les canaux privés ne s'affichent que si le bot (ou l'un de ses rôles) a été autorisé à entrer. Les serveurs peuvent créer jusqu'à 10 canaux par minute.

## server.members

```js
const member = await server.members.fetch(userId);      // with roles, nickname, timeout
const everyone = await server.members.fetch();          // pages through all of them, 500 at a time
const page = await server.members.list({ limit: 200, after: lastId });

for await (const member of server.members.iterate()) {  // stream big servers page by page
  …
}

server.members.search('alice');                          // cached members by name or nickname
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

`before` et `after` sont des heures : une Date, une chaîne ISO ou un Message (son heure de création).

## Écrire le vôtre

Les managers sont des classes simples (`CachedManager` et les amis sont exportés), vous pouvez donc les étendre. Chaque action correspond également à un appel `client.rest` ; voir [REST](rest.md).
