# REST et limites de débit

Chaque méthode de yapin.js est un appel au robot de Yapin API (`https://www.yapin.gg/api/bot/v1`) via `client.rest`. Vous pouvez l'appeler directement pour tout ce qui n'est pas encore terminé par yapin.js :

```js
import { Routes } from 'yapin.js';

const { servers } = await client.rest.get(Routes.servers());
await client.rest.post(Routes.channelMessages(channelId), { body: { content: 'hi' } });
await client.rest.get(Routes.channelMessages(channelId), { query: { limit: 10, before: new Date() } });
await client.rest.put(Routes.meAvatar(), { body: pngBytes, contentType: 'image/png' });
```

| Options | |
| --- | --- |
| `body` | Données compatibles JSON, ou octets bruts / un Blob / FormData (avec `contentType`) |
| `query` | Un objet. `undefined` et `null` sont laissés de côté ; Les dates deviennent des chaînes ISO. |
| `timeout` | ms (30 000 par défaut) |
| `retries` | par défaut 3 |
| `signal` | un AbortSignal |
| `auth` | `false` pour n'envoyer aucun jeton |

`Routes` a tous les chemins, avec des identifiants codés pour vous : `Routes.server(id)`, `Routes.serverMember(id, userId)`, `Routes.channelMessageReaction(ch, msg, emoji)`, `Routes.interactionCallback(id, token)` et le reste.

Le client REST fonctionne également seul, sans client :

```js
import { REST, Routes } from 'yapin.js';
const rest = new REST({ token: process.env.YAPIN_TOKEN });
console.log(await rest.get(Routes.me()));
```

## Limites de taux

| Quoi | Limite |
| --- | --- |
| Messages | 30 par minute par serveur (par DM dans DMs) et 30 par minute au total (300 pour les robots vérifiés) |
| Réponses aux commandes | Les 5 premières réponses à une commande slash (envoyées avec `replyTo` dans les 15 minutes) ne comptent pas dans la limite globale |
| Bouton `reply` réponses | Les 5 premiers par clic ne comptent pas dans la limite globale |
| Création de chaîne | 10 par minute par serveur |
| La voix bouge / se déconnecte | 30 la minute ; recherches vocales 60 par minute |
| Bot rejoignant/quittant la voix | 10 par minute |
| Webhooks | 5 publications toutes les 2 secondes par webhook, 30 par minute par canal |
| Commandes | 100 par robot ; noms de 1 à 32 caractères, descriptions jusqu'à 100 |

Voici comment yapin.js les gère :

- **429 avec `Retry-After`.** Il attend aussi longtemps, avec un peu d'instabilité, et réessaye, jusqu'à `rest.retries` fois. D'autres requêtes adressées à la même route sont mises en file d'attente derrière elle au lieu d'échouer également. S'il s'agit de la limite à l'échelle du bot (« 300 messages par minute au total »), chaque envoi attend.
- **429 sans `Retry-After`.** Attendre n'aidera pas (le même message deux fois, plus de 10 réponses en un clic), donc il lance immédiatement un `RateLimitError`.
- **503 avec `Retry-After`.** Yapin' était occupé et rien n'a été fait, il attend donc et réessaye.
- **Erreurs réseau.** GET, PUT et DELETE sont réessayés avec interruption. POST et PATCH ne le sont pas, car cela pourrait envoyer quelque chose deux fois.
- **Longues attentes.** Un `Retry-After` sur `rest.maxRetryAfter` (60 s) est lancé au lieu d'attendre.

Chaque 429 émet également `rateLimited` sur le client, qu'il soit réessayé ou non :

```js
client.on(Events.RateLimited, ({ method, path, retryAfter, global }) => {
  console.warn(`Rate limited on ${method} ${path} for ${retryAfter}s${global ? ' (bot-wide)' : ''}`);
});
```

L'envoi de réponses avec `ctx.reply` / `message.reply` utilise `replyTo`, qui est exempté de la limite globale. Préférez-le pour les réponses aux commandes.

## Erreurs

Un appel échoué renvoie un `YapinAPIError` :

```js
try {
  await member.kick();
} catch (error) {
  if (error.status === 403) return ctx.reply("I can't kick them (my role needs Kick members and to be higher than theirs).");
  throw error;
}
```

| Statut | Signification |
| --- | --- |
| 400 | Mauvaise saisie. Le message dit quoi. |
| 401 | Jeton manquant ou erroné |
| 403 | Non autorisé : le bot n'est pas sur ce serveur ou ses rôles ne disposent pas de l'autorisation |
| 404 | Introuvable ou le bot ne peut pas le voir |
| 409 | La personne n'a pas de voix |
| 429 | Ralentir (`RateLimitError`) |
| 503 | Yapin’ est occupé |

L'erreur comprend `status`, `message` (la propre explication de Yapin), `method`, `path`, `body`, `retryAfter`, plus `isRateLimit`, `isMissingPermissions` et `isNotFound`.

## Images et liens de fichiers

Le API donne des images sous forme de chemins (`avatar_path`, `icon_path`, `attachment_path`). Les structures les transforment en liens pour vous (`user.avatarURL()`, `server.iconURL()`, `message.attachmentURL`). Pour le faire vous-même, utilisez `cdn(bucket, path)` de [utilitaires](utilities.md#cdn-links).

## CORS

Le API de Yapin autorise n'importe quelle origine, de sorte qu'un bot peut s'exécuter dans une page de navigateur. Gardez le jeton hors de tout élément public.
