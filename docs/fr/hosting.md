# Hébergement

Un bot Yapin' n'a besoin d'aucun URL public, d'aucun port ouvert et d'aucune redirection de port. Il récupère ses propres événements et fonctionne donc correctement sur votre propre ordinateur derrière n'importe quel routeur. Laissez-le fonctionner dans un endroit qui reste allumé, et vous avez terminé.

## Sur votre propre machine ou un VPS

```sh
YAPIN_TOKEN=yb_… node bot.js
```

Pour le maintenir en marche et le redémarrer en cas de crash, utilisez un gestionnaire de processus :

```sh
npm i -g pm2
pm2 start bot.js --name my-bot
pm2 save && pm2 startup
```

Ou une unité systemd :

```ini
[Service]
ExecStart=/usr/bin/node /srv/my-bot/bot.js
Environment=YAPIN_TOKEN=yb_…
Restart=always
WorkingDirectory=/srv/my-bot
```

Arrêtez proprement pour que le curseur d'événement soit enregistré et que les appels vocaux soient laissés :

```js
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await client.destroy();
    process.exit(0);
  });
}
```

Ajoutez `sequenceStore: '.yapin-seq'` pour qu'un redémarrage rattrape ce qu'il a manqué. Voir [Passerelle](gateway.md#catching-up-after-a-restart).

## Hébergement du bot Yapin

Les [bots vérifiés] (#getting-verified) peuvent s'exécuter sur les propres conteneurs de Yapin : **Paramètres → Développeur → votre bot → Hébergement**.

- **Plans.** Petit (disque 256 MB RAM, 0,25 CPU, 512 MB) convient à la plupart des robots. Grand (1 disque GB RAM, 1 disque CPU, 2 disques GB) est destiné aux robots sur plus de 50 serveurs. Avec Yapin' Plus, un petit robot peut fonctionner gratuitement.
- **Code.** Liez un dépôt public GitHub (et une branche, jusqu'à 20 MB). Un bot qui utilise yapin.js a des dépendances, utilisez donc un dépôt plutôt que le téléchargement d'un seul fichier.
- **Installer.** Les dépendances de `package.json` sont installées pour vous (les scripts d'installation ne s'exécutent pas).
- **Démarrer.** Il exécute votre script `start` s'il s'agit exactement de `node file.js`, sinon `main`, sinon `bot.js`, sinon `index.js`.
- **Jeton.** Votre bot reçoit son propre jeton sous le nom de `process.env.YAPPER_BOT_TOKEN`, nouveau à chaque démarrage. `client.login()` le lit automatiquement, alors ne mettez pas de jeton dans votre code.
- **Crashs.** Le bot est redémarré pour vous. Cinq crashs ou trois éliminations par manque de mémoire en 10 minutes l'arrêtent ; vérifiez les journaux sur l'onglet.

Un `package.json` minimal pour l'hébergement :

```json
{
  "type": "module",
  "main": "bot.js",
  "scripts": { "start": "node bot.js" },
  "dependencies": { "yapin.js": "^0.1.0" }
}
```

L'hébergement exécute Node, de sorte que la passerelle fonctionne immédiatement sur Node 22+.

## Se faire vérifier

Votre bot fonctionne dès le départ sur vos propres serveurs. Pour permettre à d'autres serveurs de l'ajouter :

1. Dans l'onglet **Communauté**, rédigez une description (20 à 300 caractères) et appuyez sur **Publier pour examen**. Yapin' vérifie chaque bot à la main.
2. Avant la vérification, le bot doit se trouver sur 3 serveurs que vous ne possédez pas, chacun avec plus de 3 membres. Appuyez sur **Laisser les propriétaires du serveur l'ajouter** et partagez son bot ID ; toute personne disposant de Gérer le serveur peut l'ajouter depuis **Paramètres du serveur → Bots → Avoir un bot ID ?** (jusqu'à 10 serveurs jusqu'à ce qu'il soit vérifié). Publiez-le dans un canal promotionnel de bot ; s'il vous plaît, ne faites pas DM des étrangers.
3. Une fois approuvé, il reçoit une balise BOT, s'affiche dans les robots de la communauté et sur /bots, peut envoyer 300 messages par minute au lieu de 30 et peut utiliser l'hébergement.

Pour un bot conçu pour une seule communauté, appuyez plutôt sur **Demander une vérification privée**. Vous obtenez la même balise, les mêmes limites et le même hébergement, mais ils ne sont répertoriés nulle part.

## Limites à prévoir

- 2 bots par personne (10 avec Yapin’ Plus), 25 bots par serveur, 100 commandes par bot.
- 30 messages par minute par serveur et 30 au total (300 vérifiés). Voir [REST](rest.md#rate-limits).
- Les mêmes règles de contenu s’appliquent aux robots comme aux personnes.
