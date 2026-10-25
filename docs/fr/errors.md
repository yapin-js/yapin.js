# Erreurs

## Où vont les erreurs

yapin.js ne laisse jamais une erreur dans votre code faire planter le bot :

| Où c'est arrivé | Où ça va |
| --- | --- |
| Un écouteur d'événements (synchronisé ou asynchrone) | `error` |
| Une commande | `commandError`, ou `error` si rien n'écoute. Voir [Commandes](commands.md#errors). |
| Un gestionnaire de boutons | `error` |
| L'écouteur, le bouton ou le hook de déchargement d'un module | `error`, étiqueté avec le module |
| Un `send` / `reply` / `edit` / `react` que vous n'attendiez pas | `error` |
| Quelque chose que vous attendiez | Jeté à vous, comme d'habitude |

Sans écouteur `error`, les erreurs sont enregistrées avec leur origine :

```
[yapin] [module fun /joke] Error: boom
    at …
```

Les rapports d'erreurs yapin.js contiennent `module`, `command` et/ou `where` :

```js
client.on(Events.Error, (error) => {
  report(error, { module: error.module, command: error.command, where: error.where });
});
```

## Classes d'erreur

| Classe | Quand |
| --- | --- |
| `YapinAPIError` | Le API a refusé une demande. A `status`, `message`, `method`, `path`, `body` et `retryAfter`. Voir [REST](rest.md#errors). |
| `RateLimitError` | Un `YapinAPIError` pour un 429 qui ne se laissait pas attendre. `global` est vrai pour la limite à l’échelle du bot. |
| `YapinError` | yapin.js lui-même : un mauvais token, un échec de validation, une interaction expirée, un module qui ne se charge pas. `code` est l'un des `ErrorCodes`. |
| `UserError` | Commandes lancées pour dire quelque chose à la personne (`ctx.error('…')`) |
| `ArgumentError` | Un argument de commande incorrect ou manquant. A `option`, `value` et `reason`. |
| `PreconditionError` | Une vérification de commande échouée. `precondition` est `serverOnly`, `dmOnly`, `ownerOnly`, `roles`, `permissions`, `check` ou `cooldown`. |
| `CooldownError` | Une commande utilisée trop tôt. `remaining` est en ms. |

```js
import { YapinAPIError, YapinError, ErrorCodes } from 'yapin.js';

try {
  await client.login();
} catch (error) {
  if (error.code === ErrorCodes.TokenInvalid) console.error('Make a new token in Settings → Developer');
  else throw error;
}
```

## ErrorCodes

| Codes | |
| --- | --- |
| `TokenMissing` | Aucun jeton transmis et aucun `YAPIN_TOKEN` défini |
| `TokenInvalid` | Le jeton n'est pas un jeton de robot, ou Yapin' l'a rejeté |
| `AlreadyLoggedIn` | `login()` appelé deux fois |
| `RequestTimeout` | Une demande a pris plus de temps que `rest.timeout` |
| `NetworkError` | La demande n'a jamais reçu de réponse |
| `ValidationError` | Un constructeur ou une charge utile a dépassé une limite. Le message dit lequel. |
| `InvalidPayload` | Quelque chose qui ne peut pas être envoyé, comme une réponse éphémère de Components V2 |
| `InteractionExpired` | Répondre à un clic après 15 minutes |
| `InteractionTooManyResponses` | Plus de 10 réponses en un clic |
| `ModuleLoadFailed`, `ModuleNotFound` | Chargement des modules et fichiers de commandes |
| `CommandConflict` | Le même nom de commande, ou un alias, deux fois |
| `CommandLimit` | Plus de 100 commandes enregistrées |
| `VoiceUnavailable` | `@livekit/rtc-node` ou ffmpeg est manquant |
| `OAuth2Error` | La connexion avec Yapin' a échoué |

## S'écraser volontairement

Pour conserver le comportement par défaut de Node, qui consiste à planter en cas d'erreur (par exemple, sous un gestionnaire de processus qui redémarre), relancez :

```js
client.on(Events.Error, (error) => {
  console.error(error);
  process.exit(1);
});
```
