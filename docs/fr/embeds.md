# Intégrations

Les messages du bot peuvent contenir jusqu'à 5 cartes intégrées.

```js
import { EmbedBuilder } from 'yapin.js';

const embed = new EmbedBuilder()
  .setTitle('Match result')
  .setURL('https://example.com/match/42')
  .setDescription('**Blue** won 3-1. [Replay](https://example.com/r/42)')
  .setColor('#ff6b4a')
  .setAuthor({ name: 'Score Bot', iconURL: 'https://i.imgur.com/abc.png' })
  .addFields(
    { name: 'MVP', value: `${member}`, inline: true },
    { name: 'Time', value: '34:12', inline: true },
  )
  .setThumbnail('https://i.imgur.com/thumb.png')
  .setImage('https://media.tenor.com/x.gif')
  .setFooter({ text: 'Season 2' })
  .setTimestamp();

await channel.send({ embeds: [embed] });
await message.reply(embed);           // an embed on its own works too
```

| Méthode | Limite |
| --- | --- |
| `setTitle(text)` | 256 |
| `setDescription(text)` | 4096. Markdown et `[masked](links)` fonctionnent. |
| `setURL(url)` | http(s), 512 |
| `setColor(color)` | `0xff6b4a`, `'#ff6b4a'`, `'ff6b4a'`, un nom de `Colors` (`'Blurple'`, `'Red'`, …), `'Random'` ou `[r, g, b]` |
| `setAuthor({ name, url, iconURL })` | nom 256 |
| `addFields(...fields)` / `addField(name, value, inline)` | 10 champs ; nom 256, valeur 1024. Les champs en ligne se trouvent 3 par ligne. |
| `setFields(...)`, `spliceFields(i, n, ...)` | |
| `setThumbnail(url)` / `setImage(url)` | https |
| `setFooter({ text, iconURL })` | texte 2048 |
| `setTimestamp(date?)` | maintenant si laissé de côté ; `null` le supprime |

Transmettez `null` à n’importe quel poseur pour supprimer cette partie. Les intégrations d'un message sont limitées à 6 000 caractères, en comptant les titres, les descriptions, les champs, les noms d'auteurs et les pieds de page. `embed.length` vous indique où vous êtes.

Les objets simples dans la forme API fonctionnent partout à la place d'un générateur :

```js
channel.send({ embeds: [{ title: 'Hi', description: 'Plain objects work', color: 0x57f287 }] });
```

Pour modifier une intégration que vous avez reçue, utilisez `EmbedBuilder.from(message.embeds[0]).setColor('Red')`.

## Photos

Les images doivent être des liens https vers les téléchargements Yapin ou l'un de ces hôtes : i.imgur.com, media.tenor.com, media.giphy.com, i.giphy.com, upload.wikimedia.org, raw.githubusercontent.com, avatars.githubusercontent.com, utilisateur-images.githubusercontent.com, i.ytimg.com, cdn.discordapp.com, media.discordapp.net, pbs.twimg.com, i.redd.it, statique-cdn.jtvnw.net, i.scdn.co, s4.anilist.co, cdn.myanimelist.net, nekos.best et cdn.weeb.sh. La liste est exportée sous le nom `AllowedMediaHosts`.

yapin.js vérifie https mais ne vérifie pas l'hôte, donc un hôte Yapin' ajoute des travaux ultérieurs immédiatement. Un hôte qui n'est pas autorisé reçoit un 400 de Yapin' qui le dit.

Les avatars et les icônes de serveur se présentent sous forme de chemins. Utilisez `user.avatarURL()`, `server.iconURL()` ou `cdn(bucket, path)` pour obtenir un lien.

Un lien direct vers une image (`.png`, `.jpg`, `.gif`, `.webp`) dans le contenu d'un message s'affiche sous forme d'image, vous pouvez donc également publier des images par URL.
