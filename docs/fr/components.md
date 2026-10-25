# Boutons et composants V2

## Boutons

Les messages des robots peuvent comporter jusqu'à 5 lignes contenant jusqu'à 5 boutons sous le texte et les intégrations.

```js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'yapin.js';

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('vote:yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('🍕'),
  ButtonBuilder.danger('No', 'vote:no'),                            // shortcut
  ButtonBuilder.link('Menu', 'https://example.com/menu'),           // opens a link; the bot isn't told
);

await channel.send({ content: 'Pizza tonight?', components: [row] });
```

| Style | Regards | Besoins |
| --- | --- | --- |
| `primary` | flou | un `customId` |
| `secondary` | gris | un `customId` |
| `success` | vert | un `customId` |
| `danger` | rouge | un `customId` |
| `link` | lien | un https `url` (pas d'identifiant personnalisé) |

Les règles sont vérifiées au fur et à mesure que vous construisez :

- Chaque bouton nécessite une étiquette (jusqu'à 80 caractères) ou un emoji : `'🔥'` ou un emoji de serveur `'<:name:id>'`.
- Les identifiants personnalisés comportent de 1 à 100 caractères et doivent être différents dans un message.
- `setDisabled()` grise un bouton.

Un message contenant uniquement des boutons nécessite toujours `content` ou une intégration.

## Gestion des clics

Acheminez les clics par identifiant personnalisé avec `client.components.button(pattern, handler)` ou le raccourci `client.button(…)` :

```js
client.button('vote:yes', (i) => i.ephemeral('Yes it is!'));             // exact id
client.button('vote:*', (i) => i.ephemeral(`You picked ${i.customId}`)); // anything starting with "vote:"
client.button('vote:{choice}', (i) => i.ephemeral(`You picked ${i.params.choice}`)); // named parts
client.button('page:{list}:{n}', (i) => showPage(i, i.params.list, Number(i.params.n)));
client.button(/^role:(?<roleId>.+)$/, (i) => toggleRole(i, i.params.roleId));         // RegExp, named groups → params
```

Chaque gestionnaire correspondant s'exécute, dans l'ordre ajouté. `button()` renvoie une fonction qui supprime à nouveau le gestionnaire. `client.components.once(pattern, handler)` exécute un gestionnaire une seule fois.

Chaque clic émet également `interactionCreate`, pour une journalisation ou une manipulation ponctuelle.

### Réponse dans les 3 secondes

Les utilisateurs voient « Cette interaction a échoué » si personne ne répond dans les 3 secondes. yapin.js reconnaît pour vous : un clic sans réponse du gestionnaire dans les 2,5 secondes obtient un `ack`. Un travail lent est donc une bonne chose ; répondez ou mettez à jour lorsque c'est fait. L'interaction reste ouverte pendant 15 minutes et prend jusqu'à 10 réponses. Désactivez-le avec `components: { autoAck: false }`.

## L'interaction

Un clic est un `ButtonInteraction` :

| | |
| --- | --- |
| `i.customId` | L'identifiant personnalisé du bouton |
| `i.params` | Pièces nommées de votre modèle |
| `i.user`, `i.userId`, `i.member` | Qui a cliqué |
| `i.message`, `await i.fetchMessage()` | Le message sur lequel le bouton est activé |
| `i.channel`, `i.server` | Où |
| `i.expiresAt`, `i.isExpired()` | Quand on ne peut plus répondre (15 minutes) |
| `i.responded`, `i.replied`, `i.deferred`, `i.responses` | Ce qui a été envoyé jusqu'à présent |

| Réponse | Ce que la personne voit |
| --- | --- |
| `i.reply(payload)` | Un nouveau message dans la chaîne (contenu, embeds, boutons) |
| `i.reply({ content, ephemeral: true })` ou `i.ephemeral(payload)` | Un message qu'eux seuls voient (texte et intégration) jusqu'à ce qu'ils le rechargent ou le rejettent |
| `i.update(payload)` | Le message cliqué change. Les pièces laissées de côté sont conservées, `null` les supprime. |
| `i.deferUpdate()` ou `i.ack()` | Rien de visible, juste "compris" |
| `i.followUp(payload)` | Un autre message après la première réponse |

```js
client.button('counter:{n}', (i) => {
  const n = Number(i.params.n) + 1;
  return i.update({
    content: `Clicked ${n} times`,
    components: [new ActionRowBuilder(ButtonBuilder.primary('+1', `counter:${n}`))],
  });
});
```

Désactiver les boutons après un choix :

```js
client.button('confirm:*', async (i) => {
  await i.update({ content: 'Done.', components: [new ActionRowBuilder(ButtonBuilder.success('Confirmed', 'x').setDisabled())] });
});
```

Gardez le jeton de l'interaction privé : toute personne possédant ce jeton peut répondre en tant que bot pendant 15 minutes. yapin.js le cache à `console.log` et JSON.

### Clics juste pour un message

Utilisez un collecteur lorsque la réponse appartient à une seule exécution de commande :

```js
client.command('coinflip', 'Heads or tails?', async (ctx) => {
  const message = await ctx.reply({
    content: 'Call it!',
    components: [new ActionRowBuilder(ButtonBuilder.primary('Heads', 'flip:h'), ButtonBuilder.primary('Tails', 'flip:t'))],
  });
  try {
    const click = await message.awaitMessageComponent({ filter: (i) => i.userId === ctx.authorId, time: 30_000 });
    const won = (Math.random() < 0.5 ? 'flip:h' : 'flip:t') === click.customId;
    await click.update({ content: won ? 'You win!' : 'You lose!', components: null });
  } catch {
    await message.edit({ content: 'Too slow.', components: null });
  }
});
```

Voir [Collecteurs](collectors.md) pour en savoir plus.

### Limites

Chaque personne obtient 5 clics toutes les 10 secondes et 30 par minute. Seules les personnes qui peuvent voir la chaîne et dont le délai n'est pas dépassé peuvent cliquer.

## Composants V2

Créez un message complet à partir d'éléments de mise en page : cartes avec une couleur d'accent, texte à côté d'un bouton ou d'une image, galeries, séparateurs, fichiers et rangées de boutons n'importe où. Il utilise les composants standard V2 JSON, de sorte que les mises en page d'autres applications de chat sont transférées.

```js
import { ActionRowBuilder, ButtonBuilder, ContainerBuilder, MediaGalleryBuilder, SectionBuilder, SeparatorBuilder } from 'yapin.js';

const card = new ContainerBuilder()
  .setAccentColor('Blurple')
  .addTextDisplayComponents('## Game night')
  .addSectionComponents(
    new SectionBuilder()
      .addTextDisplayComponents('**Minecraft**\nSurvival, new world')
      .setButtonAccessory(ButtonBuilder.primary('Vote', 'poll:mc')),
    (s) => s.addTextDisplayComponents('**Among Us**\nUp to 10 players').setThumbnailAccessory('https://i.imgur.com/au.png'),
  )
  .addSeparatorComponents(new SeparatorBuilder())
  .addMediaGalleryComponents(new MediaGalleryBuilder().addItems('https://i.imgur.com/a.png', { url: 'https://i.imgur.com/b.png', spoiler: true }))
  .addActionRowComponents(new ActionRowBuilder(ButtonBuilder.link('Rules', 'https://example.com/rules')));

await channel.send({ components: [card] });
```

Vous n'avez pas besoin de définir l'indicateur Components V2 ; yapin.js le définit lorsque les composants sont des éléments de présentation. Les messages V2 ne peuvent pas contenir `content` ou `embeds`. Si vous passez `content`, cela devient un affichage de texte en haut. Les intégrations sont une erreur.

| Constructeur | Tapez | Remarques |
| --- | --- | --- |
| `ContainerBuilder` | 17 | Une carte. `setAccentColor`, `setSpoiler`. Contient tout ce qui se trouve en dessous, sauf un autre conteneur. `add(...)` prend n'importe quel mélange ; les chaînes simples deviennent du texte. |
| `TextDisplayBuilder` | 10 | Markdown, rendu comme un message. Non HTML. |
| `SectionBuilder` | 9 | 1 à 3 affichages de texte plus un bouton ou un accessoire miniature |
| `ThumbnailBuilder` | 11 | Uniquement comme accessoire de section. `setURL`, `setDescription`, `setSpoiler`. |
| `MediaGalleryBuilder` | 12 | 1 à 10 photos ou vidéos mp4/webm/mov |
| `SeparatorBuilder` | 14 | Une ligne ou un espace. `setDivider(false)`, `setSpacing('large')`. |
| `FileBuilder` | 13 | Une carte de téléchargement (un lien https ; `attachment://` n'est pas pris en charge) |
| `ActionRowBuilder` | 1 | Jusqu'à 5 boutons, mêmes règles que ci-dessus |

Les méthodes conteneur acceptent des générateurs, des données brutes ou une fonction qui remplit un nouveau générateur : `.addSectionComponents((s) => s.addTextDisplayComponents('…').setButtonAccessory(…))`.

**Limites :** 40 composants par message (les composants imbriqués comptent, contrairement aux éléments de la galerie) et 4 000 caractères de texte sur tous les affichages de texte. L'imbrication ne va pas plus loin que le conteneur > section > accessoire. Chaque identifiant personnalisé doit être différent. Les médias suivent les [hôtes d'images intégrées] (embeds.md#pictures). Les réponses éphémères ne peuvent pas encore être en V2.

Modifiez un message V2 de la même manière : `message.edit({ components: [newCard] })`, ou `i.update({ components: [newCard] })` après un clic.

## Validation

Les constructeurs vérifient les limites de Yapin au fur et à mesure que vous construisez, donc une erreur se produit sur la ligne qui l'a fait, avec un message indiquant ce qui ne va pas. Pour ignorer les vérifications (par exemple, pour la vitesse lorsque l'entrée est connue) :

```js
import { disableValidators } from 'yapin.js';
disableValidators();
```
