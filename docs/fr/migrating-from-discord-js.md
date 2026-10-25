# Venant de discord.js

yapin.js suit discord.js partout où Yapin' fonctionne de la même manière, donc la plupart de ce que vous savez est conservé. Cette page répertorie ce qui est différent.

## Même

- `new Client()`, `client.login()`, `client.on(Events.X, …)`, `client.destroy()`.
- `Collection`, avec les mêmes assistants.
- Gestionnaires avec `cache` et `fetch()` : `client.channels`, `client.users`, `server.members`, `server.roles`, `channel.messages`.
- `EmbedBuilder`, `ButtonBuilder`, `ActionRowBuilder`, `ContainerBuilder`, `SectionBuilder`, `TextDisplayBuilder`, `MediaGalleryBuilder`, `SeparatorBuilder`, `ThumbnailBuilder` et `FileBuilder`, avec les mêmes noms de méthode.
- `message.reply()`, `channel.send()`, `message.edit()`, `message.react()`, `channel.bulkDelete()`, collecteurs et `awaitMessages`.
- `interaction.reply({ ephemeral: true })`, `interaction.update()`, `interaction.deferUpdate()`, `interaction.followUp()`, `interaction.customId`.
- `member.kick()`, `member.ban()`, `member.timeout(ms, reason)`, `member.roles.add()`, `member.displayName`.
- Mentions `user.displayName`, `user.globalName` et `toString()`.

## Différent

| discord.js | yapin.js | Pourquoi |
| --- | --- | --- |
| Guildes | **Serveurs** : `client.servers`, `message.server`, `Server`. `client.guilds` et `ctx.guild` fonctionnent comme des alias. | Yapin' les appelle serveurs |
| Identifiants des flocons de neige | Chaînes UUID | |
| `GatewayIntentBits` (champ de bits) | `Intents` (noms des types d'événements) : `[Intents.Messages, Intents.Interactions]` | Yapin' filtre par type d'événement. Le contenu du message est toujours inclus. |
| Commandes slash avec options enregistrées | Les commandes sont des messages : `/name args`. Les options sont analysées par yapin.js (saisies, avec explications des erreurs). Yapin' affiche les noms et les descriptions dans le menu `/`. | C'est ainsi que fonctionnent les commandes Yapin' |
| `interactionCreate` pour les commandes | `client.commands.register({ run(ctx) })` avec un `CommandContext` | Les commandes ne sont pas des interactions |
| `interaction.options.getUser()` | `ctx.options.getUser()`, ou `ctx.values.user` | |
| `SlashCommandBuilder` | Objets simples : `{ name, description, options: [{ name, type }] }` | |
| `REST` + `Routes.applicationCommands()` script de déploiement | Rien : les commandes se synchronisent à la connexion et au changement | |
| `guildMemberAdd` / `guildMemberRemove` | `serverMemberAdd` / `serverMemberRemove` | |
| `voiceStateUpdate(old, new)` | `voiceJoin(state)` et `voiceLeave(state)` | Yapin' envoie des événements de jointure et de sortie |
| `messageReactionAdd(reaction, user)` | Pareil, mais `reaction.emoji` est une chaîne | |
| `PermissionsBitField` | `Permissions` avec noms (`has('kick_members')`) | Les rôles Yapin ont des autorisations nommées |
| Sélectionnez les menus, les modaux, la saisie semi-automatique | Pas encore sur Yapin' | |
| `interaction.deferReply()` | `deferUpdate()` / `ack()`. yapin.js reconnaît les clics lents pour vous. | |
| Pièces jointes aux messages (fichiers) | `message.attachmentURL` à lire. Publiez des images par lien (un lien vers un `.png` s'affiche sous forme d'image). | Les robots ne peuvent pas encore télécharger de fichiers |
| `setPresence({ activities: [...] })` | `client.user.setPresence({ status, activity: 'text' })` | Une ligne d'activité |
| `client.user.setUsername()` | Modifie le nom d'affichage (`setDisplayName`) | Les noms d'utilisateur des robots sont corrigés |
| `@discordjs/voice` | `server.voice.connect(channel)` → `connection.play('song.mp3')` | Intégré, avec le cryptage de Yapin géré |
| Partage | Pas nécessaire | Une connexion transporte chaque serveur |

## Avant et après

```js
// discord.js
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'kick') return;
  const member = interaction.options.getMember('target');
  await member.kick();
  await interaction.reply(`Kicked ${member.displayName}`);
});

// yapin.js
client.commands.register({
  name: 'kick',
  description: 'Kick someone',
  permissions: ['kick_members'],
  options: [{ name: 'target', type: 'member', required: true }],
  async run(ctx) {
    const member = ctx.options.getMember('target');
    await member.kick();
    await ctx.reply(`Kicked ${member.displayName}`);
  },
});
```

Les fichiers de commandes de style discord.js (`export const data = { name, description }; export async function execute(ctx) {}`) se chargent tels quels avec `client.commands.load('./commands')`. Remplacez `interaction` par `ctx` à l’intérieur.

```js
// Buttons: the same builders
const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('ok').setLabel('OK').setStyle(ButtonStyle.Primary),
);
await channel.send({ content: 'Ready?', components: [row] });

// Routing clicks, without a big switch
client.components.button('ok', (i) => i.update({ content: 'Go!', components: [] }));
```
