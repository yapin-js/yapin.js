# Événements

Écoutez avec `client.on(event, listener)`. Utilisez les constantes `Events` (`Events.MessageCreate`) ou les chaînes simples (`'messageCreate'`). Les auditeurs peuvent être `async`. Si l'on lance ou rejette, l'erreur est transmise à l'événement `error` au lieu de planter le bot.

```js
import { Events } from 'yapin.js';

client.on(Events.MessageCreate, async (message) => {
  if (message.content === 'hello') await message.reply('hi!');
});
```

## Événements Yapin'

| Événement | Arguments | Quand |
| --- | --- | --- |
| `ready` (`Events.ClientReady`) | `client` | Une fois, après la connexion |
| `messageCreate` | [`Message`](structures.md#message) | Un message sur un serveur sur lequel se trouve le bot, provenant de quelqu'un d'autre |
| `serverMemberAdd` | [`ServerMember`](structures.md#servermember) | Quelqu'un a rejoint (non envoyé pour d'autres robots) |
| `serverMemberRemove` | `ServerMember` | Quelqu'un est parti. Il s'agit du membre mis en cache s'il y en avait un, sinon un membre partiel. |
| `messageReactionAdd` | [`MessageReaction`](structures.md#messagereaction), `User` | Quelqu'un a réagi |
| `messageReactionRemove` | `MessageReaction`, `User` | Quelqu'un a réagi en retour |
| `interactionCreate` | [`ButtonInteraction`](components.md#the-interaction) | Quelqu'un a cliqué sur l'un des boutons du bot |
| `voiceJoin` | [`VoiceState`](voice.md#voice-events) | Quelqu'un a rejoint un canal vocal que le bot peut voir |
| `voiceLeave` | `VoiceState` | Quelqu'un en a laissé un. Un déménagement est un congé plus une jointure, dans les deux ordres. |
| `test` | `{ bot, by, at, hello }` | Le bouton **Envoyer un événement de test** dans Paramètres → Développeur |

Certaines choses que Yapin' n'envoie pas :

- Les propres messages du bot.
- Messages provenant d'autres robots et webhooks, sauf si vous définissez `ignoreBots: false`. Cochez `message.authorBot` si vous le faites.
- Les personnes DMs envoient au bot. Un robot peut toujours ouvrir un DM et y publier.

## Événements de commande

| Événement | Arguments | Quand |
| --- | --- | --- |
| `commandRun` | `ctx` | Une commande est sur le point d'être exécutée (vérifications et arguments passés) |
| `commandSuccess` | `ctx`, `durationMs` | Il a fini sans lancer |
| `commandDenied` | `UserError`, `ctx` | Un contrôle, un temps de recharge ou une mauvaise dispute l'a arrêté. On a déjà expliqué pourquoi à la personne. |
| `commandError` | `Error`, `ctx` | Cela a jeté quelque chose d’inattendu. Sans auditeur, cela va à `error`. |
| `commandsSynced` | `commands` | La liste a été envoyée à Yapin’ |

## Événements-cadres

| Événement | Arguments | Quand |
| --- | --- | --- |
| `connected` | `{ transport, previous }` | Les événements ont commencé à se dérouler sur `'gateway'` ou `'polling'` |
| `disconnected` | `{ transport, code }` | Le socket de la passerelle s'est fermé. Il se reconnecte tout seul. |
| `rateLimited` | `{ method, path, retryAfter, global, message }` | Une demande a atteint une limite de débit. Il est réessayé pour vous lorsque cela est possible. |
| `moduleLoad` / `moduleUnload` | enregistrement du module | Un module est venu ou est parti |
| `raw` | `{ id, type, data, created_at }` | Chaque événement exactement tel que Yapin' l'a envoyé, avant son traitement |
| `error` | `Error` | Quelque chose a échoué : un écouteur, une commande, un envoi que personne n'attendait |
| `warn` | `string` | Quelque chose qui mérite d'être connu, comme l'échec de la passerelle et la prise en charge des sondages |
| `debug` | `string` | Journaux détaillés (également imprimés avec `logger: 'debug'`) |

### Erreurs

Sans écouteur `error`, les erreurs sont enregistrées avec leur origine, comme `[module fun] [/joke]`. Avec un auditeur, vous décidez :

```js
client.on(Events.Error, (error) => {
  console.error(error.module ?? '', error.command ?? '', error);
});
```

Un `send` ou un `reply` que vous n'avez pas fait, un `await`, ne plante pas le bot s'il échoue (par exemple, à cause d'une autorisation manquante). L'erreur va ici à la place. Si vous le faites `await` ou appelez `.catch()`, vous obtenez l'erreur comme d'habitude.

## Événements bruts

Vous voulez un champ yapin.js qui ne correspond pas, ou un type d'événement qu'il ne connaît pas encore ? Utilisez `raw` :

```js
client.on(Events.Raw, (event) => {
  if (event.type === 'message') console.log(event.data.channel_name);
});
```

## Intentions

Pour réduire le trafic, recevez uniquement ce que vous utilisez :

```js
import { Client, Intents } from 'yapin.js';

new Client({ intents: [Intents.Messages, Intents.Interactions, Intents.Members] });
```

`Intents.Members`, `Intents.Reactions` et `Intents.Voice` sont des groupes. Les commandes arrivent sous forme de messages, alors conservez `Intents.Messages` si vous avez des commandes. Gardez `Intents.Interactions` si vous avez des boutons.
