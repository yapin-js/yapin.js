# Voix

## Événements vocaux

```js
client.on(Events.VoiceJoin, (state) => console.log(`${state.userId} joined ${state.channelId}`));
client.on(Events.VoiceLeave, (state) => console.log(`${state.userId} left ${state.channelId}`));
```

Un `VoiceState` a `userId`, `channelId`, `serverId`, `joined`, `user`, `member`, `channel`, `server` et `isMe` (il s'agit du bot lui-même, comme si un modérateur le déconnectait).

Un mouvement est un `voiceLeave` plus un `voiceJoin`, dans n'importe quel ordre. Une connexion interrompue qui revient envoie également les deux.

## Qui est en voix

`server.voice.states` est tenu au courant de ces événements. Pour la vraie image en ce moment :

```js
const channels = await server.voice.fetch();     // Collection<channelId, userId[]>, empty channels included
const where = await server.voice.channelOf(userId);
member.voice.channelId;                          // as last seen
voiceChannel.memberIds;
```

Ces recherches sont limitées à 60 par minute par bot.

## Déplacer les gens

Ceux-ci ont besoin de Move Members et d’un rôle plus élevé que la personne :

```js
await server.voice.move(userId, otherChannel);   // or member.voice.move(channel)
await server.voice.disconnect(userId);           // or member.voice.disconnect()
```

Jusqu'à 30 mouvements et déconnexions par minute par bot. La personne doit être autorisée à rejoindre la nouvelle chaîne et le bot doit voir les deux chaînes. Un `409` signifie qu'ils ne sont pas en voix. Ceux-ci ne fonctionnent jamais sur le personnel de Yapin.

### Rejoignez-nous pour créer

Créez une chaîne vocale appelée **Rejoindre pour créer**, puis donnez au bot Gérer les chaînes et déplacer les membres :

```js
const made = new Set();

client.on(Events.VoiceJoin, async (state) => {
  const channel = await client.channels.fetch(state.channelId);
  if (channel.name !== 'Join to create') return;
  const user = await client.users.fetch(state.userId);
  const room = await state.server.channels.create(`${user.displayName}'s room`, { type: 'voice', category: channel.categoryId });
  made.add(room.id);
  await state.server.voice.move(state.userId, room);
});

client.on(Events.VoiceLeave, async (state) => {
  if (!made.has(state.channelId)) return;
  const channels = await state.server.voice.fetch();
  if (channels.get(state.channelId)?.length) return; // someone's still there
  made.delete(state.channelId);
  await client.channels.cache.get(state.channelId)?.delete();
});
```

## Bots musicaux

Les robots peuvent rejoindre un canal vocal et lire de l'audio. Vous avez besoin de `npm i @livekit/rtc-node`, plus [ffmpeg](https://ffmpeg.org) pour décoder les fichiers.

> **Lisez uniquement l'audio pour lequel vous avez les droits.** Le streaming à partir de YouTube, Spotify, SoundCloud et des services similaires enfreint leurs conditions, tout comme l'extraction de leur audio. Utilisez votre propre musique, des morceaux libres de droits ou Creative Commons (avec le crédit demandé) ou un flux radio qui le permet. Yapin' désactive les robots qui jouent à des choses pour lesquelles ils n'ont pas les droits.

```js
client.commands.register({
  name: 'play',
  description: 'Play a song from the music folder',
  serverOnly: true,
  options: [{ name: 'song', required: true }],
  async run(ctx) {
    const name = ctx.values.song.replace(/[^\w-]/g, '');
    const channelId = await ctx.server.voice.channelOf(ctx.authorId);
    if (!channelId) return ctx.reply('Join a voice channel first');

    const connection = await ctx.server.voice.connect(channelId);
    await ctx.reply(`Playing ${name}`);
    await connection.play(`music/${name}.mp3`);   // resolves when the song ends
    await connection.leave();
  },
});
```

`connect()` fait toute la jointure pour vous :

1. Il reçoit un ticket de Yapin’.
2. Il se connecte avec LiveKit.
3. Il remet la clé multimédia du robot à toutes les personnes participant à l'appel.
4. Il publie une piste audio.

Les appels sur Yapin’ sont cryptés de bout en bout. La copie de la clé de chaque personne est scellée afin que lui seul puisse l'ouvrir, et sans cette étape, personne n'entendrait le robot.

### VoiceConnection

| | |
| --- | --- |
| `play(input, { seek, args, ffmpeg })` | Un chemin de fichier, un http(s) URL ou un flux lisible. Tout ce que ffmpeg peut lire. Se résout lorsqu'il se termine ou est arrêté. |
| `playPCM(stream)` | Petit-boutiste brut 16 bits PCM, stéréo 48 kHz par défaut |
| `pause()`, `resume()`, `stop()` | |
| `setVolume(0 to 2)` | 1 est normal |
| `leave()` | Quitter l'appel |
| `muted` | Le robot a rejoint en mode silencieux (pas d'autorisation de parler ou mis en sourdine par un modérateur) |
| `e2ee` | L'appel est crypté (il a été traité) |
| événements | `'start'`, `'finish'`, `'error'`, `'disconnect'` |

`server.voice.connection` / `client.voice.connections` donnent les connexions actives. `server.voice.leave()` supprime le bot même si son propre code perd la trace. Options pour `connect` : `sampleRate` (48000), `channels` (2), `bitrate` (128000) et `rtc` pour passer vous-même le module LiveKit.

### Une file d'attente

```js
const queues = new Map(); // server id → { connection, songs }

async function enqueue(server, channelId, song) {
  let q = queues.get(server.id);
  if (!q) {
    q = { connection: await server.voice.connect(channelId), songs: [] };
    queues.set(server.id, q);
    q.connection.on('disconnect', () => queues.delete(server.id));
  }
  q.songs.push(song);
  if (q.songs.length === 1) playNext(server.id);
}

async function playNext(serverId) {
  const q = queues.get(serverId);
  while (q?.songs.length) {
    await q.connection.play(`music/${q.songs[0]}.mp3`).catch(console.error);
    q.songs.shift();
  }
  await q?.connection.leave();
}

// skip: queues.get(server.id)?.connection.stop()
```

### Règles

Le bot reçoit les mêmes contrôles qu'un membre : il doit voir la chaîne et disposer de Connect, et une interdiction de serveur, une interdiction de voix ou un délai d'attente l'empêche d'entrer. Il ne peut entendre personne ni partager de vidéo. Il peut s'agir d'un canal vocal par serveur ; en rejoindre un autre laisse le premier. Les modérateurs peuvent le désactiver ou le déconnecter, mais pas le déplacer. Jusqu'à 10 jointures et sorties par minute par bot.

`server.voice.join(channel)` vous donne le ticket brut LiveKit si vous souhaitez vous connecter avec votre propre code. Ensuite, vous devez effectuer la remise des clés vous-même, sinon personne ne vous entendra.
