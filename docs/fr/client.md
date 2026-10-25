# Le client

`Client` est votre robot. Il se connecte à Yapin', conserve des caches de ce qu'il voit, transforme les événements en objets et vous donne des gestionnaires pour tout le reste.

```js
import { Client } from 'yapin.js';

const client = new Client({ /* options */ });
await client.login(); // resolves once the bot is ready
```

`login()` se résout lorsque le bot est prêt. À ce moment-là, il a récupéré son propre profil, envoyé vos commandes à Yapin' et commencé à recevoir des événements. Le bot continue de fonctionner jusqu'à ce que vous appeliez `client.destroy()`.

## Possibilités

Chaque option est facultative.

| Options | Par défaut | Ce qu'il fait |
| --- | --- | --- |
| `token` | `YAPIN_TOKEN`, puis `YAPPER_BOT_TOKEN` | Le jeton du bot. Vous pouvez également le transmettre à `login(token)`. |
| `prefixes` | `['/', '!']` | Préfixes de commande. Peut comporter plus d’un caractère (`'yap!'`). Peut être une fonction `(message) => prefixes` pour les préfixes par serveur ; cela peut être asynchrone. `prefix: '?'` est également accepté. |
| `intents` | tous les événements | Quels types d'événements recevoir, comme `[Intents.Messages, Intents.Interactions]`. Voir [Passerelle](gateway.md#intents). |
| `ignoreBots` | `true` | Ignorez les messages des autres robots et webhooks, afin que deux robots ne puissent pas se répondre indéfiniment. |
| `transport` | `'auto'` | `'auto'` utilise la passerelle lorsqu'elle le peut et interroge autrement. `'gateway'` ou `'polling'` force un. |
| `maxEventAge` | `null` | Lors du rattrapage après un redémarrage, ignorez les événements plus anciens que ce nombre de secondes (jusqu'à 86 400). |
| `sequenceStore` | `null` | N'oubliez pas le curseur d'événement lors des redémarrages : un chemin de fichier tel que `'.yapin-seq'` ou `{ get, set }`. Voir [Passerelle](gateway.md#catching-up-after-a-restart). |
| `presence` | `null` | Définir lors de la connexion : `{ status: 'online' \| 'idle' \| 'dnd', activity: 'Playing chess' }`. |
| `commands.help` | `false` | Ajoute le `/help` intégré. `true` ou `{ name, color, title, aliases }`. |
| `commands.autoSync` | `true` | Envoyez la liste de commandes à Yapin' lors de la connexion et à chaque fois qu'elle change. |
| `commands.replyOnError` | `true` | Informez les gens lorsqu'une commande échoue (mauvais arguments, autorisations manquantes…). |
| `commands.errorMessage` | `'Something went wrong running that command.'` | La réponse aux erreurs inattendues. |
| `commands.formatError` | `null` | `(error, ctx) => payload \| null` pour écrire vos propres réponses d'erreur. |
| `commands.owners` | `[]` | ID utilisateur supplémentaires traités comme propriétaires pour `ownerOnly`, en plus du propriétaire du bot. |
| `commands.ownersBypassCooldowns` | `true` | Les propriétaires ignorent les temps de recharge. |
| `commands.mentionPrefix` | `true` | `@Bot ping` fonctionne comme `/ping`. |
| `commands.caseSensitive` | `false` | Rendre `/PING` différent de `/ping`. |
| `commands.registerAliases` | `false` | Répertoriez également les alias dans le menu `/`. Ils comptent dans la limite de 100 commandes. |
| `components.autoAck` | `true` | Le bouton de reconnaissance clique sur aucun gestionnaire n'a répondu, donc les gens ne voient pas « Cette interaction a échoué ». |
| `components.autoAckAfter` | `2500` | Quand faire ça, en ms. Yapin' autorise 3 secondes. |
| `cache.messages` | `100` | Messages conservés par canal. |
| `cache.users` / `cache.members` | `Infinity` | Limites de ces caches. |
| `rest.timeout` | `30000` | Délai d'expiration par requête, en ms. |
| `rest.retries` | `3` | Nouvelles tentatives pour les limites de débit, les réponses occupées et les erreurs réseau sur les requêtes sécurisées. |
| `rest.maxRetryAfter` | `60` | Le `Retry-After` le plus long (en secondes) attendu ; les plus longs lancent. |
| `logger` | niveau d'information | `false` pour faire taire, `'debug'` pour tout, ou votre propre enregistreur (n'importe quoi avec `debug`, `info`, `warn` et `error`, comme pino). |
| `voice.rtc` | automobile | Le module `@livekit/rtc-node`, si vous souhaitez le réussir vous-même. |
| `WebSocket` | intégré | Une classe WebSocket pour la passerelle. `false` désactive la passerelle. |
| `baseURL`, `gatewayURL`, `fetch` | de Yapin | Pour les proxys et les tests. |

## Propriétés

| Propriété | Qu'est-ce que c'est |
| --- | --- |
| `client.user` | Le propre compte du bot : un `ClientUser` avec `setAvatar`, `setPresence` et ainsi de suite. Disponible après connexion. |
| `client.application` | `{ id, name, public, ownerId }` |
| `client.servers` (`client.guilds`) | Serveurs : [ServerManager](managers.md) |
| `client.channels` | Chaque chaîne vue : [ChannelManager](managers.md) |
| `client.users` | Chaque utilisateur a vu : [UserManager](managers.md) |
| `client.commands` | Le [gestionnaire de commandes](commands.md) |
| `client.components` | Le [routeur de boutons](components.md) |
| `client.modules` | [Modules](modules.md) |
| `client.voice` | Les [connexions vocales] du bot (voice.md) |
| `client.rest` | Le [client REST](rest.md) pour les appels bruts API |
| `client.stream` | Le [flux d'événements](gateway.md) |
| `client.logger` | L'enregistreur en service |
| `client.readyAt`, `client.uptime`, `client.isReady()` | Quand le bot est devenu prêt |
| `client.transport` | `'gateway'` ou `'polling'` |
| `client.ping` | Aller-retour du battement de cœur de la passerelle en ms, ou `null` lors de l'interrogation |

## Méthodes

| Méthode | Ce qu'il fait |
| --- | --- |
| `login(token?)` | Se connecte. Se résout avec le jeton une fois prêt. |
| `destroy()` | Se déconnecte, quitte la voix, enregistre le curseur d'événement. |
| `send(channelId, payload)` | Envoie à une chaîne par identifiant sans la récupérer au préalable. |
| `command(name, description, run)` | Raccourci pour `commands.register`. |
| `button(pattern, handler)` | Raccourci pour `components.button`. |
| `webhookHandler({ secret })` | Un gestionnaire de nœud `(req, res)` pour les [webhooks d'événements] (webhooks.md#event-webhooks). |

## Arrêter proprement

```js
process.on('SIGINT', async () => {
  await client.destroy();
  process.exit(0);
});
```

## Profil et présence

```js
await client.user.setAvatar('./avatar.png');         // a path, an https URL, a Buffer or a Blob (PNG/JPG/GIF/WebP, 8 MB)
await client.user.setBanner('./banner.png');         // 10 MB
await client.user.edit({ displayName: 'Dice Bot', bio: 'Rolls dice. /roll 2d6' });
await client.user.setPresence({ status: 'dnd', activity: 'Moderating' });
await client.user.setActivity('with fire');          // keeps the status
await client.user.setAvatar(null);                   // removes it
```

L'image colle, vous n'avez donc besoin de la régler qu'une seule fois.
