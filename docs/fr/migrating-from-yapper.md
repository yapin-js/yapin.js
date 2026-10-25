# Venant de yapper.js

`yapper.js` est le fichier unique officiel de Yapin, SDK. yapin.js couvre tout ce qu'il fait : le même API, la même transmission d'événements (passerelle avec repli d'interrogation), le même cryptage vocal, des rouages ​​comme modules. Il ajoute des structures, une mise en cache, un cadre de commandes, des collecteurs et des types.

## Le starter bot, côte à côte

```js
// yapper.js
import { Bot } from './yapper.js';
const bot = new Bot(process.env.YAPPER_BOT_TOKEN);
bot.command('ping', 'Is the bot alive?', (msg) => msg.reply('pong 🏓'));
bot.command('roll', 'Roll a die, like /roll 20', (msg) => {
  const n = Number(msg.argv[0]);
  const sides = Number.isSafeInteger(n) && n >= 2 && n <= 1000 ? n : 6;
  msg.reply(`🎲 ${1 + Math.floor(Math.random() * sides)} (d${sides})`);
});
bot.on('message', (msg) => { if (msg.mentioned) msg.reply(`hey ${msg.authorMention}, try /ping`); });
bot.on('member_join', async (ev) => {
  const channels = await bot.channels(ev.server_id);
  const general = channels.find((c) => c.kind === 'text' && /general|welcome|chat/i.test(c.name));
  if (general) bot.send(general.id, `welcome <@${ev.user_id}>! you're member #${ev.member_count}`);
});
bot.start();
```

```js
// yapin.js
import { Client, Events } from 'yapin.js';
const client = new Client();
client.command('ping', 'Is the bot alive?', (ctx) => ctx.reply('pong 🏓'));
client.commands.register({
  name: 'roll',
  description: 'Roll a die, like /roll 20',
  options: [{ name: 'sides', type: 'integer', min: 2, max: 1000, default: 6 }],  // checked for you
  run: (ctx) => ctx.reply(`🎲 ${1 + Math.floor(Math.random() * ctx.values.sides)} (d${ctx.values.sides})`),
});
client.on(Events.MessageCreate, (message) => { if (message.mentioned) message.reply(`hey ${message.author}, try /ping`); });
client.on(Events.ServerMemberAdd, async (member) => {
  const channels = await member.server.channels.fetch({ type: 'text' });
  const general = channels.find((c) => /general|welcome|chat/i.test(c.name));
  general?.send(`welcome ${member}! you're member #${member.server.memberCount}`);
});
client.login();
```

## Carte de noms

| yapper.js | yapin.js |
| --- | --- |
| `new Bot(token, opts)` | `new Client(opts)` + `client.login(token)` ; le jeton vient également de `YAPPER_BOT_TOKEN` |
| `bot.start()` (se résout à l'arrêt) | `client.login()` (se résout une fois prêt) |
| `bot.stop()` | `client.destroy()` |
| `opts.prefixes`, `opts.ignoreBots`, `opts.log` | `prefixes`, `ignoreBots`, `logger` |
| `opts.gateway: false` | `transport: 'polling'` (`gateway: false` fonctionne toujours) |
| `bot.on('message')` | `client.on('messageCreate')`, étant donné un `Message` |
| `bot.on('member_join' / 'member_leave')` | `serverMemberAdd` / `serverMemberRemove`, étant donné un `ServerMember` |
| `bot.on('reaction_add' / 'reaction_remove')` | `messageReactionAdd` / `messageReactionRemove`, étant donné `(reaction, user)` |
| `bot.on('voice_join' / 'voice_leave')` | `voiceJoin` / `voiceLeave`, étant donné un `VoiceState` |
| `bot.on('interaction')` | `interactionCreate` |
| `bot.on('command', msg)` | `commandRun` / `commandSuccess`, étant donné `ctx` |
| `bot.on('ready', me)` | `ready`, étant donné le client (`client.user` est le bot) |
| `bot.command(name, desc, fn)` avec `msg.args` / `msg.argv` | `client.command(name, desc, fn)` avec `ctx.args` / `ctx.argv`, ou dactylographié `options` et `ctx.values` |
| `bot.onButton(/^vote:/, fn)` | `client.button('vote:*', fn)` ou `'vote:{choice}'` pour `i.params.choice` |
| `i.custom_id`, `i.user_id` | `i.customId`, `i.userId` |
| `i.reply / i.ephemeral / i.update / i.ack` | le même, plus `i.reply({ ephemeral: true })`, `deferUpdate`, `followUp` |
| `msg.reply / msg.say / msg.authorMention` | `message.reply`, `message.channel.send`, `${message.author}` |
| `msg.author_id`, `msg.channel_id`, `msg.server_id` | `message.authorId`, `message.channelId`, `message.serverId` |
| `bot.send(ch, text, { embeds, components, replyTo })` | `client.send(ch, { content, embeds, components, replyTo })` ou `channel.send(…)` |
| `bot.sendLayout(ch, [...])` | `channel.send({ components: [container] })` : V2 est détecté |
| `bot.edit / bot.editLayout` | `message.edit(…)` / `channel.messages.edit(id, …)` |
| `bot.delete / bulkDelete / pin / unpin / react / unreact / reactions` | `message.delete()`, `channel.bulkDelete()`, `message.pin()`, `message.react()`, `message.fetchReactions()` |
| `bot.messages(ch, n)`, `bot.messagesAfter(ch, t)`, `bot.message(ch, id)` | `channel.messages.fetch({ limit })`, `fetch({ after })`, `fetch(id)` |
| `bot.servers() / server(id)` | `client.servers.fetch()` / `fetch(id)` |
| `bot.channels(server, { type })`, `categories`, `channel(id)` | `server.channels.fetch({ type })`, `server.channels.categories`, `client.channels.fetch(id)` |
| `bot.members(server, after)`, `member(server, user)` | `server.members.list({ after })`, `server.members.fetch(user)` (ou `fetch()` pour tous) |
| `bot.roles(server)`, `addRole`, `removeRole`, `setNickname` | `server.roles.fetch()`, `member.roles.add / remove`, `member.setNickname` |
| `bot.kick / ban / unban / bans` | `member.kick()`, `server.bans.create / remove / fetch` |
| `bot.timeout(server, user, minutes, reason)` | `member.timeout(duration, reason)`. **`duration` est en millisecondes** (ou `'10m'`), comme discord.js. |
| `bot.voice(server)`, `moveMember`, `disconnectMember` | `server.voice.fetch()`, `server.voice.move`, `server.voice.disconnect` |
| `bot.connectVoice(rtc, server, ch)` → `call.source.captureFrame(…)` | `server.voice.connect(ch)` → `connection.play('song.mp3')` (ou `playPCM`) |
| `bot.joinVoice / leaveVoice` | `server.voice.join(ch)` / `server.voice.leave()` |
| `bot.createChannel / editChannel / deleteChannel / createCategory / deleteCategory` | `server.channels.create`, `channel.edit`, `channel.delete`, `server.channels.createCategory`, `category.delete` |
| `bot.dm(user)` / `bot.dmSend(user, text)` | `client.users.createDM(user)` / `user.send(text)` |
| `bot.user(id)` | `client.users.fetch(id)` |
| `bot.setAvatar / setBanner / setProfile / setStatus` | `client.user.setAvatar / setBanner / edit({ displayName, bio }) / setPresence({ status, activity })` |
| `bot.api(method, path, body)` | `client.rest.request({ method, path, body })` ou `client.rest.get(Routes.x())` |
| `new Embed().title(…).color(…).field(…)` | `new EmbedBuilder().setTitle(…).setColor(…).addFields(…)` |
| `new Row(Button.success('Yes', 'id'))` | `new ActionRowBuilder(ButtonBuilder.success('Yes', 'id'))` |
| `new Container().accent('blue').text('…').add(…)` | `new ContainerBuilder().setAccentColor('Blue').addTextDisplayComponents('…').add(…)` |
| `Section`, `MediaGallery`, `Separator`, `Thumbnail`, `FileComponent`, `TextDisplay` | `SectionBuilder`, `MediaGalleryBuilder`, `SeparatorBuilder`, `ThumbnailBuilder`, `FileBuilder`, `TextDisplayBuilder` |
| `IS_COMPONENTS_V2` | `MessageFlags.IsComponentsV2` (rarement nécessaire : il est détecté) |

## Rouages ​​→ modules

```js
// yapper.js cog
import { Cog } from '../yapper.js';
export class Fun extends Cog {
  commands = { joke: { description: 'Tell a joke', run: (msg) => msg.reply('…') } };
  buttons = { 'vote:': (i) => i.ephemeral('thanks') };
  on = { member_join: (ev) => console.log(ev.username, 'joined') };
  check(msg) { return true; }
  cogLoad() {}
  cogUnload() {}
}
```

```js
// yapin.js module
import { Module } from 'yapin.js';
export default class Fun extends Module {
  commands = { joke: { description: 'Tell a joke', run: (ctx) => ctx.reply('…') } };
  buttons = { 'vote:*': (i) => i.ephemeral('thanks') };                     // add * for a prefix match
  events = { serverMemberAdd: (member) => console.log(member.user.username, 'joined') };
  check(ctx) { return true; }                                              // or a reason string
  load() {}
  unload() {}
}
```

`bot.loadCogs('./cogs')`, `bot.load`, `bot.unload` et `bot.reload` deviennent `client.modules.load('./cogs')`, `load`, `unload` et `reload`. Les fichiers de style `setup(bot)` fonctionnent également, comme `setup(ctx)` avec `ctx.command(…)` et `ctx.on(…)`. Voir [Modules](modules.md).

## Ce que vous obtenez en haut

- Structures et caches, au lieu d'objets bruts et d'identifiants.
- Options de commande saisies, sous-commandes, alias, temps de recharge, vérifications des autorisations et des rôles, middleware et `/help`.
- Collecteurs (`awaitMessages`, `awaitMessageComponent`, réactions).
- Reconnaissance automatique des clics lents sur les boutons.
- Rattraper après les redémarrages (`sequenceStore`) et les intentions.
- Mise en file d'attente avec limite de débit par itinéraire.
- Rechargez à chaud avec `client.modules.watch()`.
- Clients Webhook, webhooks d'événements signés et OAuth2.
- Types TypeScript.
