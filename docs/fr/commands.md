# Commandes

Sur Yapin’, les commandes sont des messages qui commencent par un préfixe : `/ping` ou `!ping`. Les commandes enregistrées apparaissent également dans le menu `/` pour tous les utilisateurs du serveur. `client.commands` gère l'ensemble du flux :

1. **Inscription.** Il envoie vos commandes à Yapin' lors de la connexion et à chaque fois qu'elles changent (jusqu'à 100).
2. **Correspondance.** Il fait correspondre les messages aux commandes : la propre détection de commande de Yapin, vos préfixes, les mentions et alias `@Bot`.
3. **Vérifications.** Il exécute les conditions préalables, les temps de recharge et le middleware.
4. **Arguments.** Il analyse les arguments en valeurs saisies et indique aux gens ce qui ne va pas lorsqu'ils font une erreur.
5. **En cours d'exécution.** Il exécute votre commande et signale les erreurs.

## Définir une commande

```js
client.commands.register({
  name: 'ban',                      // 1 to 32 lowercase letters, numbers, - or _
  description: 'Ban someone',       // up to 100 characters, shown in the "/" menu and /help
  aliases: ['b'],                   // also answer to /b
  category: 'Moderation',           // groups /help (modules set it to their name by default)
  options: [
    { name: 'member', type: 'member', required: true, description: 'Who to ban' },
    { name: 'reason', rest: true, description: 'Why' },
  ],
  serverOnly: true,
  permissions: ['ban_members'],
  cooldown: 5,                      // seconds per person
  examples: ['/ban @troll spamming'],
  async run(ctx) {
    const { member, reason } = ctx.values;
    await member.ban();
    await ctx.reply(`Banned ${member.displayName}${reason ? `: ${reason}` : ''}`);
  },
});
```

Raccourci pour les petites commandes :

```js
client.command('ping', 'Pong!', (ctx) => ctx.reply('pong'));
```

`run` peut également être appelé style `execute`, discord.js.

### Chaque champ

| Champ | Tapez | Ce qu'il fait |
| --- | --- | --- |
| `name` | chaîne | Requis. La correspondance ignore la casse, sauf si `commands.caseSensitive` est activé. |
| `description` | chaîne | Jusqu'à 100 caractères. |
| `aliases` | chaîne[] | D'autres noms. Non répertorié dans le menu `/` sauf si `commands.registerAliases` est activé. |
| `category` | chaîne | Pour `/help`. |
| `options` | tableau | Voir [Options](#options). Une chaîne simple est un raccourci pour `{ name, type: 'string' }`. |
| `subcommands` | tableau | Voir [Sous-commandes](#subcommands). |
| `serverOnly` / `dmOnly` | booléen | Où il peut être utilisé. |
| `ownerOnly` | booléen | Uniquement le propriétaire du bot (depuis Paramètres → Développeur) et `commands.owners`. |
| `permissions` | chaîne[] | L’auteur a besoin de tout cela. Voir [Autorisations](#permissions). |
| `roles` | chaîne[] | L'auteur a besoin d'au moins un de ces rôles (identifiants ou noms). |
| `checks` | fonction[] | Vos propres chèques. Voir [Chèques](#checks). |
| `cooldown` | numéro ou objet | Voir [Cooldowns](#cooldowns). |
| `hidden` | booléen | Pas dans le menu `/` ou `/help`, mais fonctionne toujours. |
| `register` | booléen | `false` : préfixe uniquement. Non envoyé à Yapin', donc il ne compte pas dans les 100. |
| `examples` | chaîne[] | Montré par `/help <command>`. |
| `run(ctx)` | fonction | La commande. |

## Le contexte

`run(ctx)` obtient un `CommandContext` :

| Propriété / méthode | Qu'est-ce que c'est |
| --- | --- |
| `ctx.values` | Options analysées en tant qu'objet simple : `const { member, reason } = ctx.values` |
| `ctx.options` | Les mêmes valeurs avec les getters de style discord.js : `ctx.options.getMember('member')`, `getString`, `getInteger`, `getUser`, `getChannel`, `getRole`, `getBoolean`, `getNumber`, `getDuration`. Passez `true` comme deuxième argument pour l'exiger. |
| `ctx.message` | Le [Message](structures.md#message) qui a exécuté la commande |
| `ctx.author` / `ctx.user`, `ctx.authorId` | Qui l'a dirigé |
| `ctx.member`, `await ctx.fetchMember()` | Leur [ServerMember](structures.md#servermember) (mis en cache/récupéré) |
| `ctx.channel`, `ctx.server` (`ctx.guild`) | Où |
| `ctx.args` | Tout ce qui suit le nom de la commande, tel que saisi |
| `ctx.argv` | Les arguments découpés en mots (citations respectées) |
| `ctx.prefix`, `ctx.commandName` | Ce qui a été saisi (`'/'`, `'!'`) et le nom ou l'alias utilisé |
| `ctx.command` | Le `Command`. `ctx.usage` est sa ligne d'utilisation, comme `/ban <member> [reason...]`. |
| `ctx.state` | Un objet permettant au middleware de transmettre des informations |
| `ctx.reply(payload)` | Répondez en citant la commande. Ces réponses ne comptent pas dans la limite de messages à l'échelle du bot (les 5 premières par commande, dans un délai de 15 minutes). |
| `ctx.send(payload)` | Publier sur la chaîne sans citer |
| `ctx.react(emoji)` | Réagissez au message de commande |
| `ctx.error(message)` | Arrêtez-vous et dites à la personne pourquoi (lance un `UserError`) |

## Possibilités

Les options sont lues dans l'ordre à partir de ce qui suit la commande. Mots du groupe de citations : `/ban "Some Name" spamming`.

```js
options: [
  { name: 'target', type: 'user', required: true },
  { name: 'amount', type: 'integer', min: 1, max: 100, default: 10 },
  { name: 'color', choices: ['red', 'green', 'blue'] },
  { name: 'note', rest: true },
]
```

| Champ | Ce qu'il fait |
| --- | --- |
| `name` | La clé dans `ctx.values` |
| `type` | Un des types ci-dessous, ou le vôtre. Par défaut `'string'`. |
| `required` | Manquant signifie une réponse comme ``Missing `target`. Utilisation : `/give <target> [amount] …` `` |
| `default` | Une valeur, ou `(ctx) => value`, utilisée lorsqu'elle est manquante |
| `rest` | Dernière option uniquement. Un `string` prend le reste de la ligne tel que saisi ; d'autres types prennent chaque mot restant (sous forme de tableau). |
| `choices` | Valeurs autorisées : `['a', 'b']` ou `[{ name: 'Red', value: 0xff0000 }]`. La correspondance ignore la casse. |
| `min` / `max` | Nombres : la valeur. Cordes : la longueur. Durées : millisecondes. |
| `channelTypes` | Pour `channel` : comme `['text']` |
| `validate(value, ctx)` | Renvoie `true` ou une chaîne pour rejeter la valeur avec ce message |
| `description` | Montré par `/help <command>` |

### Espèces

| Tapez | Accepte | Donne |
| --- | --- | --- |
| `string` | n'importe quoi | `string` |
| `integer` | `42`, `-3`, `1,000` | `number` |
| `number` | `3.14` | `number` |
| `boolean` | oui/non, vrai/faux, marche/arrêt, 1/0, activer/désactiver | `boolean` |
| `user` | `<@id>`, un identifiant ou le nom d'un membre mis en cache | [`User`](structures.md#user) (récupéré) |
| `member` | pareil, sur ce serveur | [`ServerMember`](structures.md#servermember) (récupéré, avec rôles) |
| `channel` | `<#id>`, un identifiant ou un nom de chaîne | un [canal](structures.md#channels) |
| `role` | un identifiant ou un nom de rôle (`@` facultatif) | [`Role`](structures.md#role) |
| `duration` | `10m`, `1h30m`, `2 days`, `1w` | millisecondes |
| `url` | `https://…` | `URL` |

### Vos propres types

```js
client.commands.types.register('hex', (text) => (/^#?[0-9a-f]{6}$/i.test(text) ? parseInt(text.replace('#', ''), 16) : undefined), {
  message: 'That should be a color like #ff6b4a',
});

client.commands.register({ name: 'paint', options: [{ name: 'color', type: 'hex', required: true }], run: (ctx) => … });
```

Renvoyez `undefined` (ou lancez un `ArgumentError`) lorsque le texte n'est pas valide. Les résolveurs peuvent être asynchrones et obtenir `(text, ctx, option)`.

## Sous-commandes

```js
client.commands.register({
  name: 'config',
  description: 'Server settings',
  serverOnly: true,
  permissions: ['manage_server'],                       // applies to every subcommand
  subcommands: [
    { name: 'set', options: [{ name: 'key', required: true }, { name: 'value', required: true, rest: true }], run: (ctx) => … },
    { name: 'get', options: [{ name: 'key', required: true }], run: (ctx) => … },
    { name: 'reset', run: (ctx) => … },
  ],
});
```

`/config set prefix ?` exécute `set`. Les vérifications sur le parent sont exécutées en premier. Un parent sans son propre `run` répond avec son utilisation lorsqu'aucune sous-commande ne correspond. Les sous-commandes peuvent s'imbriquer.

## Conditions préalables

### Autorisations

```js
permissions: ['kick_members']                      // or PermissionFlags.KickMembers
```

yapin.js récupère les rôles du membre de l'auteur et du serveur (mis en cache pendant une minute) et vérifie les autorisations pour tous leurs rôles. Le propriétaire du serveur transmet tout. Les noms correspondent vaguement : `'kick_members'`, `'KickMembers'` et `'kickmembers'` sont identiques.

`manage_server` et `manage_messages` sont des champs sur chaque rôle Yapin. D'autres autorisations proviennent de l'objet `perms` du rôle, les noms doivent donc correspondre à ce que Yapin' utilise ici. Pour les voir, exécutez `console.log((await server.roles.fetch()).map((r) => [r.name, r.perms]))`.

Si le **bot** ne dispose pas d'une autorisation, le API répond 403. Le gestionnaire répond alors "Je n'ai pas l'autorisation de faire cela ici." et émet `commandError`.

### Rôles

```js
roles: ['Moderator', 'Admin']   // names or ids; any one is enough
```

### Chèques

```js
checks: [
  (ctx) => ctx.channel.name === 'bot-commands' || 'Use this in #bot-commands',  // a string is the reason given
  async (ctx) => !(await isBlacklisted(ctx.authorId)),                          // false: "You can't use this command here."
]
```

Un [module](modules.md) `check(ctx)` s'applique à chaque commande de ce module.

### Temps de recharge

```js
cooldown: 10                                       // 10 seconds per person
cooldown: { seconds: 60, uses: 3 }                 // 3 uses a minute per person
cooldown: { seconds: 30, scope: 'channel' }        // per channel
```

Les étendues sont `'user'` (valeur par défaut), `'member'` (un utilisateur sur un serveur), `'channel'`, `'server'` et `'global'`. Les propriétaires ignorent les temps de recharge, sauf si `commands.ownersBypassCooldowns` est `false`. Une utilisation ne compte qu’une fois les contrôles et arguments passés. Réinitialisez-en un avec `client.commands.cooldowns.reset(command, ctx)`.

## Intergiciel

Le middleware encapsule chaque commande, dans l'ordre ajouté :

```js
// Timing
client.commands.use(async (ctx, next) => {
  const start = performance.now();
  await next();
  console.log(`/${ctx.command.path} took ${Math.round(performance.now() - start)}ms`);
});

// A global gate
client.commands.use(async (ctx, next) => {
  if (maintenance && ctx.authorId !== client.application.ownerId) return ctx.reply('Down for maintenance');
  await next();
});

// Load per-user data once for every command
client.commands.use(async (ctx, next) => {
  ctx.state.profile = await db.profiles.get(ctx.authorId);
  await next();
});
```

## Erreurs

| Jeté | Que se passe-t-il |
| --- | --- |
| `ctx.error('message')` / `new UserError('message')` | Répond avec le message et émet `commandDenied`. Rien n'est enregistré. |
| Un argument incorrect ou manquant (`ArgumentError`) | Répond avec ce qui ne va pas et l'utilisation. Émet `commandDenied`. |
| Un échec de vérification ou de refroidissement (`PreconditionError`, `CooldownError`) | Répond avec la raison. Émet `commandDenied`. |
| Un 403 du API | "Je n'ai pas la permission de faire ça ici." Émet `commandError`. |
| Autre chose | `commands.errorMessage`. Émet `commandError`, ou `error` si rien n'écoute. L'erreur est définie sur `.command` et `.module`. |

Utilisez `new UserError('…', { silent: true })` pour arrêter sans réponse. Réglez `commands.replyOnError: false` pour désactiver chaque réponse, ou `commands.formatError: (error, ctx) => …` pour écrire la vôtre (renvoyez `null` en cas d'absence de réponse).

```js
client.on(Events.CommandError, (error, ctx) => {
  console.error(`/${ctx.command.path} failed for ${ctx.author.username}:`, error);
});
```

## Fichiers de commandes

Mettez chaque commande dans un fichier et chargez le dossier :

```js
await client.commands.load('./commands'); // subfolders too; files starting with _ are skipped
```

```js
// commands/ping.js
export default {
  name: 'ping',
  description: 'Pong!',
  run: (ctx) => ctx.reply('pong'),
};
```

Un fichier peut également exporter un tableau de commandes, `export const command = {…}` ou discord.js de style `export const data = { name, description }` avec `export function execute(ctx) {}`.

Les chemins sont relatifs à votre fichier principal (celui que vous avez exécuté avec `node`), puis au dossier actuel.

Editez un fichier et rechargez-le sans redémarrer : `await client.commands.reload('ping')`, ou `client.modules.watch()` pour recharger lors de la sauvegarde. Pour des fonctionnalités entières avec des événements et des boutons également, utilisez [modules](modules.md).

## Préfixes

```js
new Client({ prefixes: ['!', '?', 'yap '] });

// Per-server prefixes (may be async)
new Client({ prefixes: async (message) => (await db.prefixFor(message.serverId)) ?? ['/', '!'] });
```

`@Bot ping` fonctionne toujours aussi (éteignez-le avec `commands.mentionPrefix: false`).

Lorsque la même commande existe sur deux robots, les utilisateurs peuvent en choisir un (`/fish @YourBot`). yapin.js ne répond que lorsque le bot a été sélectionné.

## Synchronisation avec Yapin'

La liste va à Yapin’ lors de la connexion. Les commandes ajoutées ou supprimées ultérieurement (chargement des modules, `register`, `unregister`) sont renvoyées une seconde après la dernière modification. Pour le faire vous-même :

```js
await client.commands.sync();               // sends only if something changed
const live = await client.commands.fetchRemote();
```

Définissez `commands.autoSync: false` pour le gérer vous-même.

## Le /help intégré

`new Client({ commands: { help: true } })` ajoute `/help`. Il répertorie les commandes regroupées par catégorie et `/help <command>` affiche l'utilisation, les alias, les options, les sous-commandes, le temps de recharge et des exemples. Personnalisez-le avec `help: { name: 'commands', color: 'Blurple', title: 'What I can do' }`. Ou remplacez-le entièrement en enregistrant votre propre commande `help`.
