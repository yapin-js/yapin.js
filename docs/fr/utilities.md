# Utilitaires

## Collection

Chaque cache est un `Collection` : un `Map` avec des assistants de style tableau.

```js
import { Collection } from 'yapin.js';

const members = await server.members.fetch();
members.filter((m) => m.roles.has('Mods'));          // a Collection
members.map((m) => m.displayName);                   // an array
members.find((m) => m.user.username === 'alice');
members.first(); members.first(5); members.last(); members.random();
members.some(fn); members.every(fn); members.reduce(fn, 0);
members.partition((m) => m.user.bot);                // [bots, people]
members.sort((a, b) => a.joinedAt - b.joinedAt);      // in place; toSorted() for a copy
members.sweep((m) => m.partial);                     // remove matching, returns the count
members.ensure(id, () => makeDefault());
a.concat(b); a.intersect(b); a.difference(b); a.equals(b);
```

`LimitedCollection(maxSize)` oublie ses entrées les plus anciennes après `maxSize`. Les caches de messages l'utilisent.

## Formateurs

```js
import { bold, italic, strikethrough, inlineCode, codeBlock, quote, hyperlink, heading,
  unorderedList, orderedList, userMention, channelMention, formatEmoji, escapeMarkdown } from 'yapin.js';

bold('hi')                      // **hi**
codeBlock('js', 'let x = 1')    // ```js …```
hyperlink('docs', 'https://…')  // [docs](https://…)
heading('Title', 2)             // ## Title
userMention(id)                 // <@id>   (or just `${user}`)
channelMention(id)              // <#id>   (or `${channel}`)
formatEmoji('party', id)        // <:party:id>
escapeMarkdown(userInput)       // shows *stars* literally
```

`MentionPatterns.User`, `.Channel` et `.Emoji` sont des RegExps globaux pour la sélection de mentions hors texte. `message.mentions` le fait déjà pour vous.

## Liens CDN

```js
import { cdn, CDN } from 'yapin.js';

cdn('icons', server.iconPath);    // https://files.yapper.website/icons/<path>
CDN.avatar(path); CDN.banner(path); CDN.icon(path); CDN.attachment(path);
```

Les chemins commençant par `/` (images intégrées) pointent vers `https://www.yapin.gg`. `null` signifie qu'il n'y a pas d'image. Une nouvelle image reçoit toujours un nouveau chemin, les liens peuvent donc être mis en cache en toute sécurité.

## Durées

```js
import { parseDuration, formatDuration } from 'yapin.js';

parseDuration('1h30m');    // 5400000
parseDuration('2 days');   // 172800000
parseDuration('soon');     // null
formatDuration(5400000);   // '1h 30m'
```

Unités : `ms`, `s`, `m` / `min`, `h`, `d`, `w` et leurs formes longues.

## Messages longs

```js
import { splitMessage } from 'yapin.js';
for (const part of splitMessage(longText)) await channel.send(part);   // ≤ 2000 each, split on lines then spaces
```

## Constantes

| | |
| --- | --- |
| `Events` | Noms des événements clients |
| `Intents` | Types d'événements à recevoir, voir [Passerelle](gateway.md#intents) |
| `ChannelType` | `Text`, `Voice`, `DM`, `Category` |
| `ButtonStyle` | `Primary`, `Secondary`, `Success`, `Danger`, `Link` |
| `ComponentType` | Numéros de type des composants V2 |
| `SeparatorSpacingSize` | `Small`, `Large` |
| `MessageFlags` | `IsComponentsV2` |
| `PresenceStatus` | `Online`, `Idle`, `DoNotDisturb` |
| `PermissionFlags` | Noms des autorisations |
| `Colors` | `Blurple`, `Green`, `Red`, `Yapin`, … |
| `Limits` | Chaque limite documentée : `Limits.MessageContent` (2000), `Limits.EmbedTotal` (6000), … |
| `AllowedMediaHosts` | Hôtes autorisés à intégrer des photos |
| `GatewayOpcodes`, `GatewayCloseCodes`, `GatewayEventTypes` | Le protocole de passerelle |
| `Routes` | Chaque chemin API |
| `version` | La version yapin.js |
