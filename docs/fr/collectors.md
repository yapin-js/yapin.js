# Collectionneurs

Les collectionneurs attendent que des choses se produisent (messages, clics de boutons, réactions) pendant un certain temps ou jusqu'à une limite.

## Possibilités

| Options | |
| --- | --- |
| `filter(item, …, collected)` | Ne collectez que ce qui passe. Peut-être asynchrone. |
| `time` | Fin après autant de ms |
| `idle` | Fin après autant de ms sans rien collecté |
| `max` | Terminez après avoir collecté autant |
| `maxProcessed` | Terminez après en avoir vu autant, passant ou pas |
| `dispose` | Réactions : supprimez ceux qui sont à nouveau supprimés |

Événements : `collect`, `ignore` (vu mais filtré), `dispose` et `end` avec `(collected, reason)`. La raison est `'time'`, `'idle'`, `'limit'`, `'processedLimit'`, `'user'` (de `stop()`), ou tout ce que vous transmettez à `stop(reason)`.

## Messages

```js
const collector = channel.createMessageCollector({ filter: (m) => m.authorId === ctx.authorId, time: 30_000 });
collector.on('collect', (m) => console.log('got', m.content));
collector.on('end', (collected, reason) => console.log(`${collected.size} messages (${reason})`));
```

Ou attendez-les comme une promesse :

```js
const replies = await channel.awaitMessages({ filter: (m) => m.authorId === ctx.authorId, max: 1, time: 15_000 });
const answer = replies.first();
if (!answer) return ctx.send('No answer, never mind.');
```

Ajoutez `errors: ['time']` pour rejeter au lieu de résoudre lorsque le temps est écoulé.

## Clics sur les boutons

```js
const message = await ctx.reply({ content: 'Pick one', components: [row] });

// One click
const click = await message.awaitMessageComponent({ filter: (i) => i.userId === ctx.authorId, time: 60_000 });
await click.update({ content: `You picked ${click.customId}`, components: null });

// Many clicks
const collector = message.createMessageComponentCollector({ time: 120_000 });
collector.on('collect', (i) => i.update({ content: `Last click: ${i.customId}` }));
collector.on('end', () => message.edit({ components: null }));
```

`awaitMessageComponent` rejette lorsque le temps est écoulé. Le `InteractionCollector` général se rétrécit par `message`, `channel`, `server`, `user` et `customId` (une chaîne ou RegExp) :

```js
import { InteractionCollector } from 'yapin.js';
new InteractionCollector(client, { channel, customId: /^quiz:/, time: 60_000 });
```

Les clics collectés de cette manière sont toujours dirigés vers les gestionnaires `client.components`. Si rien ne répond, l'accusé de réception automatique le couvre.

## Réactions

```js
const message = await ctx.reply('React 👍 to join');
await message.react('👍');
const collector = message.createReactionCollector({
  filter: (reaction, user) => reaction.emoji === '👍' && !user.bot,
  time: 60_000,
  dispose: true,
});
collector.on('end', (collected) => ctx.send(`${collected.size} joined`));
```

Les réactions collectées sont codées `"emoji:userId"`.

## Itération asynchrone

Chaque collecteur est un itérateur asynchrone :

```js
const collector = channel.createMessageCollector({ time: 60_000 });
for await (const message of collector) {
  if (message.content === 'stop') collector.stop();
  else await message.react('✅');
}
```

La boucle se termine lorsque le collecteur le fait.

`await collector.next` donne l'élément suivant ou le rejette si le collecteur se termine en premier.
