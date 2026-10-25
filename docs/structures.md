# Structures

Everything Yapin’ sends becomes an object with properties and methods. Ids are UUID strings. Any structure can be logged or `JSON.stringify`'d without leaking the client or tokens.

Some objects are **partial**: yapin.js knew only the id when it made them, such as the channel of a message whose channel it hasn't fetched. They have `partial: true`. `await thing.fetch()` fills them in.

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

| Property | |
| --- | --- |
| `id`, `channelId`, `serverId`, `authorId` | |
| `content`, `embeds`, `components` | |
| `author`, `member`, `channel`, `server` | |
| `createdAt`, `createdTimestamp`, `editedAt`, `editedTimestamp` | |
| `mentions` | `userIds`, `channelIds`, `users`, `members`, `channels`, `me`, `has(userOrChannel)` |
| `mentioned` | The bot was mentioned |
| `attachmentURL`, `attachmentPath` | The attached file, if any |
| `replyToId`, `reference` | What it replies to |
| `pinned`, `pinnedAt` | |
| `authorBot` | Sent by another bot or a webhook (only seen with `ignoreBots: false`) |
| `isComponentsV2` | It's a [layout message](components.md#components-v2) |
| `editable` | The bot sent it |

| Method | |
| --- | --- |
| `reply(payload)` | Reply quoting it |
| `edit(payload)` | Edit one of the bot's own messages. `null` removes a part: `edit({ components: null })`. Changing only the buttons doesn't mark it edited. |
| `delete()` | The bot's own, or anyone's with Manage messages |
| `react(emoji)`, `unreact(emoji)` | Unicode emoji. `unreact` removes the bot's own. |
| `fetchReactions()` | `Collection<emoji, { emoji, count, userIds, me }>` |
| `pin()`, `unpin()` | Manage messages |
| `fetch()`, `fetchReference()`, `fetchMember()` | |
| `createReactionCollector()`, `awaitReactions()` | See [Collectors](collectors.md) |
| `createMessageComponentCollector()`, `awaitMessageComponent()` | Clicks on its buttons |

### What you can send

Everywhere a payload goes (`send`, `reply`, `edit`, interaction answers):

```js
'just text'
embed                                                       // an EmbedBuilder
[embed1, embed2]
{ content, embeds, components, replyTo }                    // replyTo: a Message or id (send only)
{ components: [new ContainerBuilder()…] }                   // Components V2, see components.md
```

Text is up to 2000 characters. Markdown works, mention people with `<@id>` (or just `${user}`), and link channels with `<#id>` (or `${channel}`). Use `splitMessage(text)` for longer text.

## User

| | |
| --- | --- |
| `id`, `username` | |
| `globalName` | The display name they set, or null |
| `displayName` | `globalName`, else `username` |
| `avatarURL()`, `avatarPath`, `badges`, `bot` | |
| `toString()` | `<@id>`, so `` `hi ${user}` `` mentions them |
| `send(payload)`, `createDM()` | DMs follow their DM setting: they may need to be a friend or share a server |
| `fetch()` | |

`client.user` is a `ClientUser`: a User with `bio`, `bannerURL()`, `setAvatar`, `setBanner`, `edit({ displayName, bio })`, `setPresence({ status, activity })`, `setStatus` and `setActivity`. See [Client](client.md#profile-and-presence).

## Server

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

Someone in a server.

| | |
| --- | --- |
| `id`, `user`, `server`, `serverId` | |
| `nickname`, `displayName` | `displayName` is the nickname, else display name, else username |
| `joinedAt` | |
| `roles` | `roles.cache` (Collection of Role), `roles.ids`, `roles.has(role)`, `roles.highest`, `await roles.add(role)`, `await roles.remove(role)`. A role can be a Role, an id or a name. |
| `permissions` | A [Permissions](#permissions) from their cached roles (fetch roles first with `server.roles.fetch()`) |
| `isTimedOut()`, `communicationDisabledUntil`, `activeTimeout` | |
| `voice` | `{ channelId, channel, move(channel), disconnect() }`, as last seen |

| Method | Needs |
| --- | --- |
| `kick()` | Kick members |
| `ban()` | Ban members |
| `timeout(duration, reason?)` | Timeout members. `duration` is milliseconds or a string like `'10m'`, `'2h'`, `'7d'`. Up to 28 days, rounded up to whole minutes. |
| `removeTimeout()` | Timeout members |
| `setNickname(nick)` | Manage nicknames. Up to 32 characters; `''` or `null` clears it. |
| `send(payload)`, `createDM()`, `fetch()` | |

Moderation also works by id without a member object: `server.members.kick(id)`, `server.bans.create(id)`, `server.members.timeout(id, '1h')`.

## Channels

`client.channels.cache.get(id)` gives the right class:

| Class | `type` | |
| --- | --- | --- |
| `TextChannel` | `'text'` | `send`, `messages`, `bulkDelete`, collectors, plus everything below |
| `VoiceChannel` | `'voice'` | `memberIds`, `members`, `join()` |
| `DMChannel` | `'dm'` | `send`, `messages`, `recipient` |
| `CategoryChannel` | `'category'` | `children`, `setName`, `delete` |

Use `channel.isText()`, `isVoice()`, `isDM()`, `isCategory()` and `isTextBased()` to tell them apart.

Server channels (text and voice) have `name`, `server`, `position`, `category` (`parent`), `private`, `readOnly` and `slowmode`, plus:

```js
await channel.edit({ name: 'lounge', slowmode: 10 });
await channel.setPrivate(true, [modRole]);        // only these roles see it
await channel.setReadOnly(true, [announcerRole]); // only these roles can post
await channel.setCategory(category);
await channel.delete();
```

These need Manage channels. Slowmode is in seconds, up to 21600.

## Role

| | |
| --- | --- |
| `id`, `name`, `color`, `hexColor`, `position` | |
| `manageServer`, `manageMessages`, `perms` | As Yapin’ sends them |
| `permissions` | A [Permissions](#permissions) |
| `members` | Cached members with the role |
| `auto` | Set on roles Yapin’ manages itself |
| `comparePositionTo(other)` | |

## Permissions

```js
member.permissions.has('kick_members');                    // all of them
member.permissions.any('ban_members', 'kick_members');     // at least one
member.permissions.missing(['ban_members', 'kick_members']);
```

Names match loosely (`'KickMembers'` works). `PermissionFlags` has the common names. `toArray()` lists the held names, normalised (`'kickmembers'`).

The server owner has everything: `all` is `true`, `has()` and `any()` are always true, and `toArray()` includes every `PermissionFlags` name.

## MessageReaction

From `messageReactionAdd` / `messageReactionRemove`, together with the `User` who reacted:

| | |
| --- | --- |
| `emoji`, `messageId`, `channelId`, `serverId`, `userId`, `messageAuthorId` | |
| `message` (partial), `fetchMessage()`, `channel`, `server`, `member`, `user` | |
| `onOwnMessage` | It's on one of the bot's messages |
| `react()` | The bot reacts with the same emoji |

A reaction roles bot in a few lines:

```js
const ROLES = { '🔴': 'Red team', '🔵': 'Blue team' };
client.on(Events.MessageReactionAdd, async (reaction) => {
  if (reaction.messageId !== ROLE_MESSAGE_ID || !ROLES[reaction.emoji]) return;
  const member = await reaction.server.members.fetch(reaction.userId);
  await reaction.server.roles.ensure();
  await member.roles.add(ROLES[reaction.emoji]);
});
```
