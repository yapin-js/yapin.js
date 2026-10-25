# Connectez-vous avec Yapin'

Permettez aux gens de se connecter à votre site Web avec leur compte Yapin', en utilisant le flux de code d'autorisation OAuth2. Votre site ne voit jamais leur mot de passe, seulement ce qu'ils acceptent de partager.

> Ceci est en cours de test sur Yapin', donc seules certaines personnes peuvent créer des applications pour le moment.

## Installation

1. Dans **Paramètres → Développeur → Connexion avec Yapin'**, créez une application. Vous obtenez un client ID et un secret client. Le secret est révélé une fois ; gardez-le sur votre serveur.
2. Ajoutez votre redirection URL, comme `https://my.site/callback`. Cela doit correspondre exactement. Il doit s'agir de https, sauf `http://localhost` et `http://127.0.0.1`, qui fonctionnent pour les tests.

## Le flux

```js
import { OAuth2Client } from 'yapin.js';

const oauth = new OAuth2Client({
  clientId: process.env.YAPIN_CLIENT_ID,
  clientSecret: process.env.YAPIN_CLIENT_SECRET,
  redirectURI: 'https://my.site/callback',
});

// 1. Send them to Yapin’
app.get('/login', (req, res) => {
  req.session.state = OAuth2Client.generateState();
  res.redirect(oauth.generateAuthURL({ state: req.session.state }));
});

// 2. They come back with ?code=…&state=… (or ?error=access_denied if they said no)
app.get('/callback', async (req, res) => {
  if (req.query.error) return res.send('Login cancelled');
  if (req.query.state !== req.session.state) return res.status(400).send('Bad state');

  const token = await oauth.exchangeCode(req.query.code);   // the code works once, for 60 seconds
  const user = await oauth.fetchUser(token.accessToken);   // { id, username, displayName, avatarURL }

  req.session.userId = user.id; // use the id as the account key; usernames can change
  res.redirect('/');
});
```

`exchangeCode` renvoie `{ accessToken, tokenType, expiresIn, expiresAt, scope, raw }`. Les jetons commencent par `yo_` et durent 30 jours. Il n'y a pas encore de jetons d'actualisation, alors renvoyez les gens via la connexion lorsqu'il n'y en a plus. Un jeton cesse de fonctionner plus tôt si la personne supprime votre application dans **Paramètres → Applications autorisées**.

## Applications sans serveur (PKCE)

Les applications mobiles, de bureau et à page unique ne peuvent pas garder de secret. Laissez-le de côté et utilisez PKCE :

```js
const oauth = new OAuth2Client({ clientId, redirectURI });
const pkce = OAuth2Client.generatePKCE();           // keep pkce.verifier until the callback
const url = oauth.generateAuthURL({ state, codeChallenge: pkce.challenge });
// …later
const token = await oauth.exchangeCode(code, { codeVerifier: pkce.verifier });
```

Seul S256 est pris en charge, ce qui correspond à ce que fait `generatePKCE`. Les applications avec un serveur peuvent également utiliser PKCE.

## Détails

- **Portées :** uniquement `identify`, qui donne l'identifiant, le nom d'utilisateur, le nom d'affichage (ou `null`) et la photo de profil URL (ou `null`). Pas d'e-mail, pas de messages, pas de publication.
- **Erreurs :** `exchangeCode` et `fetchUser` lancent un `YapinError` avec le code `OAuth2Error`, plus `status` et `oauthError` (comme `invalid_grant`).
- **Limites :** 120 demandes de jetons par minute par IP. `/me` autorise 300 par minute par IP et 120 par jeton.
- **Règles :** jusqu'à 10 applications par personne et 10 redirections URLs par application. Votre application apparaît comme non créée par Yapin'. Ne faites pas semblant d'être Yapin'.
