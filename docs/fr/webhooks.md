# Webhooks

Il en existe deux sortes :

- Les **webhooks de chaîne** sont publiés dans une chaîne sans bot. Ils conviennent aux CI, aux alertes et aux flux.
- Les **webhooks d'événements** ont Yapin' POST les événements de votre bot sur votre serveur, si vous en hébergez un avec un https URL public.

## Webhooks de chaîne

Les personnes disposant de Gérer les Webhooks les créent dans **Modifier le canal → Webhooks** (jusqu'à 10 par canal). Chacun reçoit un nom et une image, ainsi qu'un URL secret qui s'affiche une fois.

```js
import { WebhookClient, EmbedBuilder } from 'yapin.js';

const hook = new WebhookClient({ url: process.env.DEPLOY_WEBHOOK_URL });
// or new WebhookClient({ id, token })

await hook.send('Deploy finished');
await hook.send({
  username: 'CI',                                    // up to 80 characters, this message only
  avatarURL: 'https://i.imgur.com/ci.png',
  embeds: [new EmbedBuilder().setTitle('Build #42').setColor('Green')],   // up to 10, with 25 fields each
  allowedMentions: { parse: ['users'] },             // the default: only users are pinged
});
```

`send()` renvoie le message publié (`?wait=true` de Yapin). Passez `wait: false` pour ignorer cela. `hook.fetchWebhook()` renvoie les informations du webhook.

Les webhooks peuvent publier jusqu'à 5 fois toutes les 2 secondes et 30 fois par minute par canal. Un 429 est attendu et réessayé. Les autres erreurs sont `YapinAPIError`s dont `code` est l'une des `WebhookErrorCodes` : `UnknownWebhook` (10015), `InvalidToken` (50027), `EmptyMessage` (50006), `InvalidFormBody` (50035), `InvalidJSON` (50109), `MissingAccess` (50001) ou `PayloadTooLarge` (40005). Un webhook cesse de fonctionner si la personne qui l'a créé est bannie du serveur.

## Webhooks d'événement

Définissez un URL dans **Paramètres → Développeur → votre bot → Avancé**, et Yapin' également POSTs à chaque événement. Les demandes sont signées avec votre secret webhook (affiché sur le même onglet). Le sondage ou la passerelle continue de fonctionner parallèlement.

```js
import http from 'node:http';
import { Client } from 'yapin.js';

const client = new Client();
http.createServer(client.webhookHandler({ secret: process.env.YAPIN_WEBHOOK_SECRET })).listen(3000);
await client.login();
```

Le gestionnaire :

1. Vérifie l'en-tête `X-Yapper-Signature` (un HMAC-SHA256 du corps brut) et rejette les mauvais avec 401.
2. Répond à 200 à la fois. Yapin' attend 3 secondes et ne réessaye pas.
3. Introduira l'événement dans le client.

Chaque identifiant d'événement est traité une seule fois, qu'il arrive par webhook, passerelle ou sondage. Cela signifie que vous pouvez exécuter les deux et que rien n’est manqué en cas d’échec de la livraison d’un webhook.

Avec Express, donnez-lui le corps brut :

```js
const handler = client.webhookHandler({ secret });
app.post('/yapin', express.raw({ type: 'application/json' }), (req, res) => {
  req.rawBody = req.body;
  return handler(req, res);
});
```

Autres aides :

```js
import { startWebhookServer, verifyWebhookSignature } from 'yapin.js';

await startWebhookServer(client, { port: 3000, path: '/yapin', secret });
verifyWebhookSignature(rawBody, req.headers['x-yapper-signature'], secret); // true / false
```
