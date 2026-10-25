# Buttons and Components V2

## Buttons

Bot messages can have up to 5 rows of up to 5 buttons under the text and embeds.

```js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'yapin.js';

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('vote:yes').setLabel('Yes').setStyle(ButtonStyle.Success).setEmoji('🍕'),
  ButtonBuilder.danger('No', 'vote:no'),                            // shortcut
  ButtonBuilder.link('Menu', 'https://example.com/menu'),           // opens a link; the bot isn't told
);

await channel.send({ content: 'Pizza tonight?', components: [row] });
```

| Style | Looks | Needs |
| --- | --- | --- |
| `primary` | blurple | a `customId` |
| `secondary` | grey | a `customId` |
| `success` | green | a `customId` |
| `danger` | red | a `customId` |
| `link` | link | an https `url` (no customId) |

The rules are checked as you build:

- Every button needs a label (up to 80 characters) or an emoji: `'🔥'` or a server emoji `'<:name:id>'`.
- Custom ids are 1 to 100 characters and must be different within a message.
- `setDisabled()` greys a button out.

A message with only buttons still needs `content` or an embed.

## Handling clicks

Route clicks by custom id with `client.components.button(pattern, handler)`, or the `client.button(…)` shorthand:

```js
client.button('vote:yes', (i) => i.ephemeral('Yes it is!'));             // exact id
client.button('vote:*', (i) => i.ephemeral(`You picked ${i.customId}`)); // anything starting with "vote:"
client.button('vote:{choice}', (i) => i.ephemeral(`You picked ${i.params.choice}`)); // named parts
client.button('page:{list}:{n}', (i) => showPage(i, i.params.list, Number(i.params.n)));
client.button(/^role:(?<roleId>.+)$/, (i) => toggleRole(i, i.params.roleId));         // RegExp, named groups → params
```

Every handler that matches runs, in the order added. `button()` returns a function that removes the handler again. `client.components.once(pattern, handler)` runs a handler only once.

Every click also emits `interactionCreate`, for logging or one-off handling.

### Answer within 3 seconds

People see "This interaction failed" if nobody answers within 3 seconds. yapin.js acknowledges for you: a click no handler answered within 2.5 seconds gets an `ack`. So slow work is fine; reply or update when it's done. The interaction stays open for 15 minutes and takes up to 10 answers. Turn this off with `components: { autoAck: false }`.

## The interaction

A click is a `ButtonInteraction`:

| | |
| --- | --- |
| `i.customId` | The button's custom id |
| `i.params` | Named parts from your pattern |
| `i.user`, `i.userId`, `i.member` | Who clicked |
| `i.message`, `await i.fetchMessage()` | The message the button is on |
| `i.channel`, `i.server` | Where |
| `i.expiresAt`, `i.isExpired()` | When it can no longer be answered (15 minutes) |
| `i.responded`, `i.replied`, `i.deferred`, `i.responses` | What's been sent so far |

| Answer | What the person sees |
| --- | --- |
| `i.reply(payload)` | A new message in the channel (content, embeds, buttons) |
| `i.reply({ content, ephemeral: true })` or `i.ephemeral(payload)` | A message only they see (text and embeds) until they reload or dismiss it |
| `i.update(payload)` | The clicked message changes. Left-out parts are kept, `null` removes them. |
| `i.deferUpdate()` or `i.ack()` | Nothing visible, just "got it" |
| `i.followUp(payload)` | Another message after the first answer |

```js
client.button('counter:{n}', (i) => {
  const n = Number(i.params.n) + 1;
  return i.update({
    content: `Clicked ${n} times`,
    components: [new ActionRowBuilder(ButtonBuilder.primary('+1', `counter:${n}`))],
  });
});
```

Disable buttons after a choice:

```js
client.button('confirm:*', async (i) => {
  await i.update({ content: 'Done.', components: [new ActionRowBuilder(ButtonBuilder.success('Confirmed', 'x').setDisabled())] });
});
```

Keep the interaction's token private: anyone with it can answer as your bot for 15 minutes. yapin.js hides it from `console.log` and JSON.

### Clicks just for one message

Use a collector when the answer belongs to one command run:

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

See [Collectors](collectors.md) for more.

### Limits

Each person gets 5 clicks per 10 seconds and 30 a minute. Only people who can see the channel and aren't timed out can click.

## Components V2

Build a whole message from layout parts: cards with an accent colour, text next to a button or a picture, galleries, separators, files, and button rows anywhere. Layout parts use the standard Components V2 JSON and type numbers, so layouts from other chat apps port over. The one difference: button rows and buttons are `type: 'row'` and `type: 'button'`, the same as under a normal message, not `1` and `2`.

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

You don't need to set the Components V2 flag; yapin.js sets it when the components are layout parts. V2 messages can't have `content` or `embeds`. If you pass `content`, it becomes a text display at the top. Embeds are an error.

| Builder | Type | Notes |
| --- | --- | --- |
| `ContainerBuilder` | 17 | A card. `setAccentColor`, `setSpoiler`. Holds everything below except another container. `add(...)` takes any mix; plain strings become text. |
| `TextDisplayBuilder` | 10 | Markdown, rendered like a message. No HTML. |
| `SectionBuilder` | 9 | 1 to 3 text displays plus a button or thumbnail accessory |
| `ThumbnailBuilder` | 11 | Only as a section accessory. `setURL`, `setDescription`, `setSpoiler`. |
| `MediaGalleryBuilder` | 12 | 1 to 10 pictures or mp4 / webm / mov videos |
| `SeparatorBuilder` | 14 | A line or space. `setDivider(false)`, `setSpacing('large')`. |
| `FileBuilder` | 13 | A download card (an https link; `attachment://` isn't supported) |
| `ActionRowBuilder` | `'row'` | Up to 5 buttons (`type: 'button'`), same rules as above |

The container methods take builders, plain data, or a function that fills a new builder: `.addSectionComponents((s) => s.addTextDisplayComponents('…').setButtonAccessory(…))`.

**Limits:** 40 components per message (nested ones count, gallery items don't) and 4000 characters of text across all text displays. Nesting goes no deeper than container > section > accessory. Every custom id must be different. Media follows the [embed picture hosts](embeds.md#pictures). Ephemeral replies can't be V2 yet.

Change a V2 message the same way: `message.edit({ components: [newCard] })`, or `i.update({ components: [newCard] })` after a click.

## Validation

Builders check Yapin’s limits as you build, so a mistake throws at the line that made it, with a message saying what's wrong. To skip the checks (say, for speed when the input is known good):

```js
import { disableValidators } from 'yapin.js';
disableValidators();
```
