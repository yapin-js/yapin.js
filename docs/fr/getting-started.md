# Commencer

Ce guide vous fait passer de rien à un robot en cours d'exécution avec quelques commandes.

## 1. Créer un compte bot

1. Dans Yapin', ouvrez **Paramètres → Développeur**, saisissez un nom et appuyez sur **Créer**.
2. Ouvrez l'onglet **Jeton** et copiez le jeton. Il commence par `yb_` et s'affiche une fois. Ne le collez jamais dans un endroit public. En cas de fuite, appuyez sur **Nouveau jeton**.
3. Ajoutez le bot à un serveur que vous gérez, depuis le même écran ou **Paramètres du serveur → Bots → Vos robots → Ajouter**. Vos propres robots fonctionnent immédiatement sur vos propres serveurs.

> Les robots doivent utiliser des comptes de robots. L'automatisation de votre propre compte (un "selfbot") est contraire aux conditions de Yapin.

## 2. Mettre en place un projet

```sh
mkdir my-bot && cd my-bot
npm init -y
npm install yapin.js
```

Ouvrez `package.json` et ajoutez `"type": "module"` pour pouvoir utiliser `import`.

Gardez le jeton hors de votre code. Mettez-le dans une variable d'environnement appelée `YAPIN_TOKEN` ; `client.login()` le lit automatiquement :

```sh
# macOS / Linux
export YAPIN_TOKEN=yb_your_token_here
# Windows PowerShell
$env:YAPIN_TOKEN = "yb_your_token_here"
```

Vous pouvez également utiliser un fichier `.env` avec le chargeur intégré de Node : exécutez `node --env-file=.env bot.js`.

## 3. Écrivez le bot

Créez `bot.js` :

```js
import { Client, Events } from 'yapin.js';

const client = new Client({
  commands: { help: true }, // a built-in /help that lists your commands
});

// A command. People type /ping or !ping, and it shows up in the "/" menu.
client.command('ping', 'Is the bot alive?', (ctx) => ctx.reply('pong 🏓'));

// A command with an option.
client.commands.register({
  name: 'roll',
  description: 'Roll a die, like /roll 20',
  options: [{ name: 'sides', type: 'integer', min: 2, max: 1000, default: 6 }],
  run(ctx) {
    const { sides } = ctx.values;
    return ctx.reply(`🎲 ${1 + Math.floor(Math.random() * sides)} (d${sides})`);
  },
});

// Any message that @mentions the bot.
client.on(Events.MessageCreate, (message) => {
  if (message.mentioned) message.reply(`hey ${message.author}, try /help`);
});

client.on(Events.ClientReady, (c) => console.log(`Logged in as ${c.user.displayName}`));

client.login();
```

## 4. Exécutez-le

```sh
node bot.js
```

Vous verrez `[yapin] YourBot is online with 3 commands`. Sur votre serveur, tapez `/ping`.

Vous ne travaillez pas ? Dans **Paramètres → Développeur → votre bot → Commencer**, appuyez sur **Envoyer l'événement de test**. Alors écoutez-le :

```js
client.on(Events.Test, (data) => console.log('test event!', data));
```

Si cela s'imprime, le bot est connecté. Activez les journaux de débogage pour en savoir plus :

```js
new Client({ logger: 'debug' });
```

## 5. Cultivez-le

- Placez les commandes dans leurs propres fichiers et chargez un dossier : voir [Commandes](commands.md#command-files).
- Ajoutez des boutons, des intégrations et des mises en page : voir [Composants](components.md) et [Incrustations](embeds.md).
- Divisez les fonctionnalités en [modules](modules.md) et rechargez-les à chaud pendant que vous travaillez.
- Donnez une fois une photo au bot, à partir du code : `await client.user.setAvatar('./avatar.png')`.

## TypeScript

Les définitions de types sont fournies avec le package. Dans TypeScript, utilisez `"module": "NodeNext"` :

```ts
import { Client, type CommandDefinition } from 'yapin.js';

const ping: CommandDefinition = { name: 'ping', run: (ctx) => ctx.reply('pong') };
```

En clair JavaScript, vous obtenez la même saisie semi-automatique dans le code VS, et `// @ts-check` en haut d'un fichier active la vérification de type.

## Autorisations dont votre bot a besoin

Un bot est membre, et tout ce qui va au-delà de la lecture et de la publication est comparé aux propres rôles du bot, tout comme pour une personne. Donnez au bot un rôle avec **Gérer les messages** à supprimer ou épingler, **Kick**, **Ban** ou **Timeout** pour la modération, **Gérer les rôles**, **Gérer les chaînes**, **Gérer les surnoms** ou **Déplacer les membres** selon vos besoins. Sans rôle, il peut lire, publier, réagir et DM.
