# Structures

Tout ce que Yapin' envoie devient un objet avec des propriétés et des méthodes. Les identifiants sont des chaînes UUID. N'importe quelle structure peut être enregistrée ou `JSON.stringify` sans fuite du client ou des jetons.

Certains objets sont **partiels** : yapin.js ne connaissait que l'identifiant lorsqu'il les a créés, comme le canal d'un message dont il n'a pas récupéré le canal. Ils ont `partial: true`. `await thing.fetch()` les remplit.

## Message

```js
client.on(Events.MessageCreate, async (message) => {
  message.content;            // the text
  message.author;             // User
  message.member;             // ServerMember, if cached (await message.fetchMember() to be sure)
  message.channel;            // TextChannel (or DMChannel)
  message.server;             // Server, or null in DMs
  message.mentioned;          // the bot was @mentioned
  message.mentions.users;     // Collection of mentioned users
});
```

| Propriété | |
| --- | --- |
| `id`, `channelId`, `serverId`, `authorId` | |
| `content`, `embeds`, `components` | |
| `author`, `member`, `channel`, `server` | |
| `createdAt`, `createdTimestamp`, `editedAt`, `editedTimestamp` | |
| `mentions` | `userIds`, `channelIds`, `users`, `members`, `channels`, `me`, `has(userOrChannel)` |
| `mentioned` | Le bot a été mentionné |
| `attachmentURL`, `attachmentPath` | Le fichier joint, le cas échéant |
| `replyToId`, `reference` | À quoi il répond |
| `pinned`, `pinnedAt` | |
| `authorBot` | Envoyé par un autre bot ou un webhook (uniquement visible avec `ignoreBots: false`) |
| `isComponentsV2` | Il s'agit d'un [message de mise en page](components.md#components-v2) |
| `editable` | Le bot l'a envoyé |

| Méthode | |
| --- | --- |
| `reply(payload)` | Répondez en le citant |
| `edit(payload)` | Modifiez l'un des propres messages du bot. `null` supprime une pièce : `edit({ components: null })`. Changer uniquement les boutons ne le marque pas comme modifié. |
| `delete()` | Celui du bot ou celui de toute personne disposant de Gérer les messages |
| `react(emoji)`, `unreact(emoji)` | Émoji Unicode. `unreact` supprime celui du bot. |
| `fetchReactions()` | `Collection<emoji, { emoji, count, userIds, me }>` |
| `pin()`, `unpin()` | Gérer les messages |
| `fetch()`, `fetchReference()`, `fetchMember()` | |
| `createReactionCollector()`, `awaitReactions()` | Voir [Collectionneurs](collectors.md) |
| `createMessageComponentCollector()`, `awaitMessageComponent()` | Clique sur ses boutons |

### Ce que vous pouvez envoyer

Partout où va une charge utile (`send`, `reply`, `edit`, réponses d'interaction) :

```js
'just text'
embed                                                       // an EmbedBuilder
[embed1, embed2]
{ content, embeds, components, replyTo }                    // replyTo: a Message or id (send only)
{ components: [new ContainerBuilder()…] }                   // Components V2, see components.md
```

Le texte peut contenir jusqu'à 2 000 caractères. Markdown fonctionne, mentionnez les personnes avec `<@id>` (ou simplement `${user}`) et liez les chaînes avec `<#id>` (ou `${channel}`). Utilisez `splitMessage(text)` pour un texte plus long.

## Utilisateur

| | |
| --- | --- |
| `id`, `username` | |
| `globalName` | Le nom d'affichage qu'ils ont défini, ou null |
| `displayName` | `globalName`, sinon `username` |
| `avatarURL()`, `avatarPath`, `badges`, `bot` | |
| `toString()` | `<@id>`, donc `` `hi ${user}` `` les mentionne |
| `send(payload)`, `createDM()` | DMs suit leur paramètre DM : ils devront peut-être être amis ou partager un serveur |
| `fetch()` | |

`client.user` est un `ClientUser` : un utilisateur avec `bio`, `bannerURL()`, `setAvatar`, `setBanner`, `edit({ displayName, bio })`, `setPresence({ status, activity })`, `setStatus` et `setActivity`. Voir [Client](client.md#profile-and-presence).

## Serveur

| | |
| --- | --- |
| `id`, `name`, `ownerId`, `memberCount`, `iconURL()` | |
| `channels` | [ServerChannelManager](managers.md#serverchannels) |
| `members` | [MemberManager](managers.md#servermembers) |
| `roles` | [RoleManager](managers.md#serverroles) |
| `bans` | [BanManager](managers.md#serverbans) |
| `voice` | [ServerVoiceManager](voice.md) |
| `owner`, `fetchOwner()`, `me` | |

## ServerMember

Quelqu'un sur un serveur.

| | |
| --- | --- |
| `id`, `user`, `server`, `serverId` | |
| `nickname`, `displayName` | `displayName` est le surnom, sinon le nom d'affichage, sinon le nom d'utilisateur |
| `joinedAt` | |
| `roles` | `roles.cache` (Collection de rôles), `roles.ids`, `roles.has(role)`, `roles.highest`, `await roles.add(role)`, `await roles.remove(role)`. Un rôle peut être un rôle, un identifiant ou un nom. |
| `permissions` | A [Autorisations](#permissions) à partir de leurs rôles mis en cache (récupérer d'abord les rôles avec `server.roles.fetch()`) |
| `isTimedOut()`, `communicationDisabledUntil`, `activeTimeout` | |
| `voice` | `{ channelId, channel, move(channel), disconnect() }`, vu pour la dernière fois |

| Méthode | Besoins |
| --- | --- |
| `kick()` | Expulser les membres |
| `ban()` | Interdire les membres |
| `timeout(duration, reason?)` | Membres ayant expiré. `duration` correspond à des millisecondes ou à une chaîne telle que `'10m'`, `'2h'`, `'7d'`. Jusqu'à 28 jours, arrondis aux minutes entières. |
| `removeTimeout()` | Membres hors délai |
| `setNickname(nick)` | Gérez les surnoms. Jusqu'à 32 caractères ; `''` ou `null` l'efface. |
| `send(payload)`, `createDM()`, `fetch()` | |

La modération fonctionne également par identifiant sans objet membre : `server.members.kick(id)`, `server.bans.create(id)`, `server.members.timeout(id, '1h')`.

## Canaux

`client.channels.cache.get(id)` donne la bonne classe :

| Classe | `type` | |
| --- | --- | --- |
| `TextChannel` | `'text'` | `send`, `messages`, `bulkDelete`, collectionneurs, et tout ce qui suit |
| `VoiceChannel` | `'voice'` | `memberIds`, `members`, `join()` |
| `DMChannel` | `'dm'` | `send`, `messages`, `recipient` |
| `CategoryChannel` | `'category'` | `children`, `setName`, `delete` |

Utilisez `channel.isText()`, `isVoice()`, `isDM()`, `isCategory()` et `isTextBased()` pour les distinguer.

Les canaux du serveur (texte et voix) ont `name`, `server`, `position`, `category` (`parent`), `private`, `readOnly` et `slowmode`, plus :

```js
await channel.edit({ name: 'lounge', slowmode: 10 });
await channel.setPrivate(true, [modRole]);        // only these roles see it
await channel.setReadOnly(true, [announcerRole]); // only these roles can post
await channel.setCategory(category);
await channel.delete();
```

Ceux-ci ont besoin de gérer les chaînes. Le mode lent est en secondes, jusqu'à 21 600.

## Rôle

| | |
| --- | --- |
| `id`, `name`, `color`, `hexColor`, `position` | |
| `manageServer`, `manageMessages`, `perms` | Comme Yapin' les envoie |
| `permissions` | A [Autorisations](#permissions) |
| `members` | Membres en cache avec le rôle |
| `auto` | Fixé sur les rôles, Yapin’ se gère lui-même |
| `comparePositionTo(other)` | |

## Autorisations

```js
member.permissions.has('kick_members');                    // all of them
member.permissions.any('ban_members', 'kick_members');     // at least one
member.permissions.missing(['ban_members', 'kick_members']);
```

Les noms correspondent vaguement (`'KickMembers'` fonctionne). `PermissionFlags` a les noms communs. Le propriétaire du serveur a tout.

## MessageReaction

De `messageReactionAdd` / `messageReactionRemove`, ainsi que des `User` qui ont réagi :

| | |
| --- | --- |
| `emoji`, `messageId`, `channelId`, `serverId`, `userId`, `messageAuthorId` | |
| `message` (partiel), `fetchMessage()`, `channel`, `server`, `member`, `user` | |
| `onOwnMessage` | C'est sur l'un des messages du bot |
| `react()` | Le bot réagit avec le même emoji |

Un bot de rôles de réaction en quelques lignes :

```js
const ROLES = { '🔴': 'Red team', '🔵': 'Blue team' };
client.on(Events.MessageReactionAdd, async (reaction) => {
  if (reaction.messageId !== ROLE_MESSAGE_ID || !ROLES[reaction.emoji]) return;
  const member = await reaction.server.members.fetch(reaction.userId);
  await reaction.server.roles.ensure();
  await member.roles.add(ROLES[reaction.emoji]);
});
```
