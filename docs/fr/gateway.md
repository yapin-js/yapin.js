# Passerelle et sondage

Yapin' conserve chaque événement pour votre bot pendant une journée et peut les diffuser de deux manières. yapin.js choisit le meilleur et bascule lui-même entre eux.

| | Comment | Besoins |
| --- | --- | --- |
| **Passerelle** | Un WebSocket, les événements sont poussés instantanément | La passerelle activée pour votre bot (elle est en version bêta) et un runtime avec WebSocket : Node 22+, Bun, Deno ou `npm i ws` |
| **Long sondage** | `GET /events?after=…&wait=25`, répondu au moment où quelque chose se passe | Rien. Cela fonctionne sur un ordinateur portable derrière n'importe quel routeur. |

Les deux portent les mêmes événements, avec les mêmes identifiants, dans le même ordre, partageant un curseur. La commutation ne laisse jamais tomber ou ne répète rien. Vos gestionnaires ne changent pas.

## Ce qui se produit

Avec `transport: 'auto'` (valeur par défaut) :

1. **Connect.** Il ouvre la passerelle, envoie `resume` avec le curseur et des battements de cœur.
2. **Pas encore activé pour le bot** (fermer le code 4003). Il interroge et réessaye la passerelle toutes les 10 minutes.
3. **Drop or zombie** (un battement de coeur sans accusé de réception). Il se reconnecte avec le backoff et reprend, donc rien n'est manqué.
4. **Continue d'échouer** (trois fois rapidement). Il interroge pendant 5 minutes, puis réessaye.
5. **Trop de prises ou de connexions** (4008, 4029). Il interroge pendant une minute.
6. **Mauvais jeton** (4004). Il s'arrête et émet un `error` avec le code `TokenInvalid`.

Écoutez `connected` / `disconnected` pour voir cela se produire, ou utilisez `logger: 'debug'` :

```js
client.on(Events.Connected, ({ transport }) => console.log('events via', transport));
client.transport; // 'gateway' | 'polling'
client.ping;      // heartbeat round trip in ms over the gateway
```

Forcez-en un avec `transport: 'gateway'` (ne jamais interroger) ou `transport: 'polling'` (ne jamais utiliser la passerelle). `gateway: false` fonctionne également pour la compatibilité yapper.js.

Les événements sont transmis à vos auditeurs un par un, dans l'ordre. Les écouteurs eux-mêmes s'exécutent simultanément, donc un gestionnaire `async` lent ne retarde pas l'événement suivant.

## Intentions

Demandez uniquement ce que vous utilisez :

```js
import { Intents } from 'yapin.js';

new Client({ intents: [Intents.Messages, Intents.Interactions] });
```

| Intention | Événements |
| --- | --- |
| `Intents.Messages` | `messageCreate` (et commandes) |
| `Intents.Interactions` | `interactionCreate` (clics sur les boutons) |
| `Intents.Members` | `serverMemberAdd`, `serverMemberRemove` (ou `MemberJoin` / `MemberLeave` seul) |
| `Intents.Reactions` | `messageReactionAdd`, `messageReactionRemove` |
| `Intents.Voice` | `voiceJoin`, `voiceLeave` |
| `Intents.Test` | `test` |
| `Intents.All` | tout (la même chose que de laisser `intents` de côté) |

Sur la passerelle, Yapin' filtre pour vous (moins de trafic). Lors de l'interrogation, les événements sont filtrés localement.

## Rattraper après un redémarrage

Par défaut, un bot démarre « maintenant ». Pour reprendre là où il s'était arrêté, conservez le curseur :

```js
new Client({ sequenceStore: '.yapin-seq' });                        // a file, written at most once a second
new Client({ sequenceStore: { get: () => db.get('seq'), set: (n) => db.set('seq', n) } });
```

Au redémarrage, le bot récupère tout ce qu'il a manqué le dernier jour. Yapin' ignore toujours les commandes slash datant de plus de 15 minutes et les clics sur les boutons ayant déjà expiré, donc un robot redémarré ne répond pas au `/ping` d'hier. Pour ignorer également les événements plus anciens, ajoutez `maxEventAge` :

```js
new Client({ sequenceStore: '.yapin-seq', maxEventAge: 300 }); // only the last 5 minutes
```

`client.destroy()` enregistre le curseur une dernière fois.

## Limites

- 2 sockets ouvertes par bot, 10 connexions par minute, 30 messages toutes les 10 secondes par socket (seuls les battements de cœur sont envoyés).
- Le bot s'affiche comme en ligne lorsque le socket est ouvert ou pendant qu'il interroge.
- Les événements sont conservés pendant une journée.

## Le protocole

Pour les curieux, ou pour rédiger votre propre client :

```
wss://rt.yapper.website/bot

← { "op": "hello", "heartbeat_interval": 30000 }
→ { "op": "identify", "token": "yb_…" }                      start from now
→ { "op": "resume", "token": "yb_…", "seq": 1234 }           everything after event 1234
← { "op": "ready", "bot": { "id": "…", "name": "…" }, "seq": 1234 }
← { "op": "event", "s": 1235, "t": "message", "d": { "id": 1235, "type": "message", "data": { … }, "created_at": "…" } }
→ { "op": "heartbeat" }
← { "op": "heartbeat_ack", "seq": 1235 }
```

Vous devez vous identifier dans les 10 secondes. `identify` et `resume` prennent également `events` (une liste de types) et `max_age`. Passer 75 secondes sans battement de coeur ferme la prise. Les codes de fermeture, tous exportés sous le nom `GatewayCloseCodes`, sont 4002 (identification en retard ou en panne), 4003 (passerelle non activée), 4004 (mauvais jeton), 4008 (trop de sockets), 4009 (pas de battement de cœur), 4029 (débit limité) et 1013 (occupé).
