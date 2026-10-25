# Modules

Un module regroupe les commandes, boutons, écouteurs d'événements et minuteries pour une fonctionnalité, généralement un fichier chacun : `modules/fun.js`, `modules/moderation.js`. discord.py et le yapper SDK appellent ces rouages.

Tout ce qu'un module enregistre lui appartient. Le déchargement supprime tout à nouveau et le rechargement lit le fichier à nouveau sans redémarrer le bot. Les erreurs sont étiquetées avec le nom du module afin que les journaux indiquent où il s'est cassé.

```js
// bot.js
import { Client } from 'yapin.js';

const client = new Client();
await client.modules.load('./modules'); // every .js in the folder, A to Z (files starting with _ are skipped)
await client.login();
```

## Un module en tant que classe

```js
// modules/fun.js
import { Module, ActionRowBuilder, ButtonBuilder } from 'yapin.js';

const JOKES = ['I know a UDP joke, but you might not get it.', 'There are 10 kinds of people…'];

export default class Fun extends Module {
  // Optional: the module's name. Defaults to the file name ('fun').
  name = 'fun';

  commands = [
    {
      name: 'joke',
      description: 'Tell a joke',
      run: (ctx) => ctx.reply({ content: this.pick(), components: [new ActionRowBuilder(ButtonBuilder.secondary('Another', 'joke:again'))] }),
    },
  ];

  buttons = {
    'joke:again': (i) => i.update({ content: this.pick() }),
  };

  events = {
    serverMemberAdd: (member) => this.logger.info(`${member.displayName} joined ${member.server.name}`),
  };

  pick() {
    return JOKES[Math.floor(Math.random() * JOKES.length)];
  }

  // Optional: false or a reason string stops this module's commands.
  check(ctx) {
    return ctx.channel.name !== 'serious-discussion' || 'Not in here!';
  }

  // Optional: runs after everything above is registered.
  load() {
    this.setInterval(() => this.logger.debug('still funny'), 60_000); // cleared on unload
  }

  // Optional: runs on unload and reload.
  unload() {}
}
```

À l'intérieur d'un module, `this.client`, `this.logger` (préfixé par le nom du module) et les assistants ci-dessous sont disponibles. Utilisez les fonctions fléchées dans les champs, comme ci-dessus, donc `this` est le module.

`commands` peut aussi être un objet : `{ joke: { description, run }, ping: (ctx) => … }`.

## Un module comme objet

```js
// modules/moderation.js
import { defineModule } from 'yapin.js';
import { kick, ban, timeout } from './_commands.js'; // _files aren't loaded as modules

export default defineModule({
  name: 'moderation',
  commands: [kick, ban, timeout],
  events: {
    messageCreate(message) {
      if (/discord\.gg\//i.test(message.content)) message.delete().catch(() => {});
    },
  },
  check: (ctx) => ctx.inServer() || 'Moderation commands only work in servers.',
  setup(ctx) {
    ctx.setInterval(() => cleanupExpiredWarnings(), 60_000);
  },
  teardown(ctx) {},
});
```

Ou la forme la plus courte : `export function setup(ctx) { ctx.command({...}); ctx.on('messageCreate', ...); }`.

## Le contexte du module

`setup(ctx)` obtient un `ModuleContext`. Les modules de classe peuvent utiliser les mêmes méthodes sur `this` :

| | |
| --- | --- |
| `ctx.client`, `ctx.name`, `ctx.logger` | |
| `ctx.command(definition)` | Enregistrez une commande appartenant au module |
| `ctx.on(event, fn)`, `ctx.once(event, fn)` | Écouter un événement client |
| `ctx.button(pattern, fn)` | Clics sur le bouton Itinéraire |
| `ctx.setTimeout(fn, ms)`, `ctx.setInterval(fn, ms)` | Minuteries effacées lors du déchargement |
| `ctx.onUnload(fn)` | Exécuter quelque chose lors du déchargement (fermer une base de données, vider un cache) |

Utilisez-les à la place des modules internes `client.on(…)`, sinon le déchargement ne pourra pas retirer les écouteurs.

## Chargement, déchargement, rechargement

```js
await client.modules.load('./modules/fun.js');   // one file (the .js can be left out)
await client.modules.load('./modules');          // a folder
await client.modules.add(Fun);                   // a class or definition made in code
client.modules.get('fun');                       // { name, file, loadedAt, … }

await client.modules.unload('fun');
await client.modules.reload('fun');              // reads modules/fun.js again
await client.modules.reloadAll();
```

Si la nouvelle version ne parvient pas à se charger, l'ancienne est remise en place et l'erreur est générée, de sorte qu'une faute de frappe ne supprime pas une fonctionnalité. Les commandes ajoutées ou supprimées sont envoyées à Yapin’ par elles-mêmes.

Les fichiers qu'un module importe lui-même (comme `./_commands.js`) ne sont pas relus lors du rechargement ; redémarrer pour ceux-là.

Les chemins sont relatifs à votre fichier principal, puis au dossier actuel. URLs fonctionne également : `new URL('./modules/fun.js', import.meta.url)`.

### Mode montre

Pendant que vous travaillez, rechargez lors de la sauvegarde :

```js
if (process.env.NODE_ENV !== 'production') client.modules.watch();
```

Cela surveille chaque fichier de module chargé et chaque [fichier de commande] (commands.md#command-files). Il renvoie une fonction qui arrête de regarder.

### Une commande /reload

```js
client.commands.register({
  name: 'reload',
  ownerOnly: true,
  hidden: true,
  options: [{ name: 'module', required: true }],
  async run(ctx) {
    await client.modules.reload(ctx.values.module);
    await ctx.reply(`Reloaded ${ctx.values.module}`);
  },
});
```

## Noms et conflits

Le nom d'un module est son `name`, sinon le nom du fichier. Deux modules portant le même nom, ou le même nom de commande dans deux modules, constituent une erreur qui nomme les deux fichiers.
