# Commands

On Yapin’, commands are messages that start with a prefix: `/ping` or `!ping`. Registered commands also show up in the `/` menu for everyone in the server. `client.commands` handles the whole flow:

1. **Registration.** It sends your commands to Yapin’ on login and again whenever they change (up to 100).
2. **Matching.** It matches messages to commands: Yapin’s own command detection, your prefixes, `@Bot` mentions and aliases.
3. **Checks.** It runs preconditions, cooldowns and middleware.
4. **Arguments.** It parses arguments into typed values and tells people what's wrong when they make a mistake.
5. **Running.** It runs your command and reports errors.

## Defining a command

```js
client.commands.register({
  name: 'ban',                      // 1 to 32 lowercase letters, numbers, - or _
  description: 'Ban someone',       // up to 100 characters, shown in the "/" menu and /help
  aliases: ['b'],                   // also answer to /b
  category: 'Moderation',           // groups /help (modules set it to their name by default)
  options: [
    { name: 'member', type: 'member', required: true, description: 'Who to ban' },
    { name: 'reason', rest: true, description: 'Why' },
  ],
  serverOnly: true,
  permissions: ['ban_members'],
  cooldown: 5,                      // seconds per person
  examples: ['/ban @troll spamming'],
  async run(ctx) {
    const { member, reason } = ctx.values;
    await member.ban();
    await ctx.reply(`Banned ${member.displayName}${reason ? `: ${reason}` : ''}`);
  },
});
```

Shorthand for small commands:

```js
client.command('ping', 'Pong!', (ctx) => ctx.reply('pong'));
```

`run` can also be called `execute`, discord.js style. Inside a regular `function`, `this` is the command definition; a command declared in a module has the module's `this` instead (see [Modules](modules.md)). Use `ctx.client` to reach the client from either.

### Every field

| Field | Type | What it does |
| --- | --- | --- |
| `name` | string | Required. Matching ignores case unless `commands.caseSensitive` is on. |
| `description` | string | Up to 100 characters. |
| `aliases` | string[] | Other names. Not listed in the `/` menu unless `commands.registerAliases` is on. |
| `category` | string | For `/help`. |
| `options` | array | See [Options](#options). A plain string is shorthand for `{ name, type: 'string' }`. |
| `subcommands` | array | See [Subcommands](#subcommands). |
| `serverOnly` / `dmOnly` | boolean | Where it can be used. |
| `ownerOnly` | boolean | Only the bot's owner (from Settings → Developer) and `commands.owners`. |
| `permissions` | string[] | The author needs all of these. See [Permissions](#permissions). |
| `roles` | string[] | The author needs at least one of these roles (ids or names). |
| `checks` | function[] | Your own checks. See [Checks](#checks). |
| `cooldown` | number or object | See [Cooldowns](#cooldowns). |
| `hidden` | boolean | Not in the `/` menu or `/help`, but still runs. |
| `register` | boolean | `false`: prefix-only. Not sent to Yapin’, so it doesn't count towards the 100. |
| `examples` | string[] | Shown by `/help <command>`. |
| `run(ctx)` | function | The command. |

## The context

`run(ctx)` gets a `CommandContext`:

| Property / method | What it is |
| --- | --- |
| `ctx.values` | Parsed options as a plain object: `const { member, reason } = ctx.values` |
| `ctx.options` | The same values with discord.js-style getters: `ctx.options.getMember('member')`, `getString`, `getInteger`, `getUser`, `getChannel`, `getRole`, `getBoolean`, `getNumber`, `getDuration`. Pass `true` as the second argument to require it. |
| `ctx.message` | The [Message](structures.md#message) that ran the command |
| `ctx.author` / `ctx.user`, `ctx.authorId` | Who ran it |
| `ctx.member`, `await ctx.fetchMember()` | Their [ServerMember](structures.md#servermember) (cached / fetched) |
| `ctx.channel`, `ctx.server` (`ctx.guild`) | Where |
| `ctx.args` | Everything after the command name, as typed |
| `ctx.argv` | The arguments split into words (quotes respected) |
| `ctx.prefix`, `ctx.commandName` | What was typed (`'/'`, `'!'`) and the name or alias used |
| `ctx.command` | The `Command`. `ctx.usage` is its usage line, like `/ban <member> [reason...]`. |
| `ctx.state` | An object for middleware to pass things along |
| `ctx.reply(payload)` | Reply quoting the command. These replies don't count towards the bot-wide message limit (the first 5 per command, within 15 minutes). |
| `ctx.send(payload)` | Post in the channel without quoting |
| `ctx.react(emoji)` | React to the command message |
| `ctx.error(message)` | Stop and tell the person why (throws a `UserError`) |

## Options

Options are read in order from what follows the command. Quotes group words: `/ban "Some Name" spamming`.

```js
options: [
  { name: 'target', type: 'user', required: true },
  { name: 'amount', type: 'integer', min: 1, max: 100, default: 10 },
  { name: 'color', choices: ['red', 'green', 'blue'] },
  { name: 'note', rest: true },
]
```

| Field | What it does |
| --- | --- |
| `name` | The key in `ctx.values` |
| `type` | One of the types below, or your own. Default `'string'`. |
| `required` | Missing means a reply like ``Missing `target`. Usage: `/give <target> [amount] …` `` |
| `default` | A value, or `(ctx) => value`, used when it's missing |
| `rest` | Last option only. A `string` takes the rest of the line as typed; other types take every remaining word (as an array). |
| `choices` | Allowed values: `['a', 'b']` or `[{ name: 'Red', value: 0xff0000 }]`. Matching ignores case. |
| `min` / `max` | Numbers: the value. Strings: the length. Durations: milliseconds. |
| `channelTypes` | For `channel`: like `['text']` |
| `validate(value, ctx)` | Return `true`, or a string to reject the value with that message |
| `description` | Shown by `/help <command>` |

### Types

| Type | Accepts | Gives |
| --- | --- | --- |
| `string` | anything | `string` |
| `integer` | `42`, `-3`, `1,000` | `number` |
| `number` | `3.14` | `number` |
| `boolean` | yes/no, true/false, on/off, 1/0, enable/disable | `boolean` |
| `user` | `<@id>`, an id, or a cached member's name | [`User`](structures.md#user) (fetched) |
| `member` | the same, in this server | [`ServerMember`](structures.md#servermember) (fetched, with roles) |
| `channel` | `<#id>`, an id, or a channel name | a [channel](structures.md#channels) |
| `role` | an id or a role name (`@` optional) | [`Role`](structures.md#role) |
| `duration` | `10m`, `1h30m`, `2 days`, `1w` | milliseconds |
| `url` | `https://…` | `URL` |

### Your own types

```js
client.commands.types.register('hex', (text) => (/^#?[0-9a-f]{6}$/i.test(text) ? parseInt(text.replace('#', ''), 16) : undefined), {
  message: 'That should be a color like #ff6b4a',
});

client.commands.register({ name: 'paint', options: [{ name: 'color', type: 'hex', required: true }], run: (ctx) => … });
```

Return `undefined` (or throw an `ArgumentError`) when the text isn't valid. Resolvers can be async and get `(text, ctx, option)`.

## Subcommands

```js
client.commands.register({
  name: 'config',
  description: 'Server settings',
  serverOnly: true,
  permissions: ['manage_server'],                       // applies to every subcommand
  subcommands: [
    { name: 'set', options: [{ name: 'key', required: true }, { name: 'value', required: true, rest: true }], run: (ctx) => … },
    { name: 'get', options: [{ name: 'key', required: true }], run: (ctx) => … },
    { name: 'reset', run: (ctx) => … },
  ],
});
```

`/config set prefix ?` runs `set`. Checks on the parent run first. A parent without its own `run` replies with its usage when no subcommand matches. Subcommands can nest.

## Preconditions

### Permissions

```js
permissions: ['kick_members']                      // or PermissionFlags.KickMembers
```

yapin.js fetches the author's member and the server's roles (cached for a minute) and checks the permissions across all their roles. The server owner passes everything. Names match loosely: `'kick_members'`, `'KickMembers'` and `'kickmembers'` are the same.

`manage_server` and `manage_messages` are fields on every Yapin’ role. Other permissions come from the role's `perms` object, so the names must match what Yapin’ uses there. To see them, run `console.log((await server.roles.fetch()).map((r) => [r.name, r.perms]))`.

If the **bot** lacks a permission, the API answers 403. The handler then replies "I don't have permission to do that here." and emits `commandError`.

### Roles

```js
roles: ['Moderator', 'Admin']   // names or ids; any one is enough
```

### Checks

```js
checks: [
  (ctx) => ctx.channel.name === 'bot-commands' || 'Use this in #bot-commands',  // a string is the reason given
  async (ctx) => !(await isBlacklisted(ctx.authorId)),                          // false: "You can't use this command here."
]
```

A [module's](modules.md) `check(ctx)` applies to every command in that module.

### Cooldowns

```js
cooldown: 10                                       // 10 seconds per person
cooldown: { seconds: 60, uses: 3 }                 // 3 uses a minute per person
cooldown: { seconds: 30, scope: 'channel' }        // per channel
```

Scopes are `'user'` (the default), `'member'` (a user within one server), `'channel'`, `'server'` and `'global'`. Owners skip cooldowns unless `commands.ownersBypassCooldowns` is `false`. A use only counts once the checks and arguments have passed. Reset one with `client.commands.cooldowns.reset(command, ctx)`.

## Middleware

Middleware wraps every command, in the order added:

```js
// Timing
client.commands.use(async (ctx, next) => {
  const start = performance.now();
  await next();
  console.log(`/${ctx.command.path} took ${Math.round(performance.now() - start)}ms`);
});

// A global gate
client.commands.use(async (ctx, next) => {
  if (maintenance && ctx.authorId !== client.application.ownerId) return ctx.reply('Down for maintenance');
  await next();
});

// Load per-user data once for every command
client.commands.use(async (ctx, next) => {
  ctx.state.profile = await db.profiles.get(ctx.authorId);
  await next();
});
```

## Errors

| Thrown | What happens |
| --- | --- |
| `ctx.error('message')` / `new UserError('message')` | Replies with the message and emits `commandDenied`. Nothing is logged. |
| A bad or missing argument (`ArgumentError`) | Replies with what's wrong and the usage. Emits `commandDenied`. |
| A failed check or cooldown (`PreconditionError`, `CooldownError`) | Replies with the reason. Emits `commandDenied`. |
| A 403 from the API | "I don't have permission to do that here." Emits `commandError`. |
| Anything else | `commands.errorMessage`. Emits `commandError`, or `error` if nothing listens. The error has `.command` and `.module` set. |

Use `new UserError('…', { silent: true })` to stop without a reply. Set `commands.replyOnError: false` to turn off every reply, or `commands.formatError: (error, ctx) => …` to write your own (return `null` for no reply).

```js
client.on(Events.CommandError, (error, ctx) => {
  console.error(`/${ctx.command.path} failed for ${ctx.author.username}:`, error);
});
```

## Command files

Put each command in a file and load the folder:

```js
await client.commands.load('./commands'); // subfolders too; files starting with _ are skipped
```

```js
// commands/ping.js
export default {
  name: 'ping',
  description: 'Pong!',
  run: (ctx) => ctx.reply('pong'),
};
```

A file can also export an array of commands, `export const command = {…}`, or discord.js-style `export const data = { name, description }` with `export function execute(ctx) {}`.

Paths are relative to your main file (the one you ran with `node`), then the current folder.

Edit a file and reload it without restarting: `await client.commands.reload('ping')`, or `client.modules.watch()` to reload on save. For whole features with events and buttons too, use [modules](modules.md).

## Prefixes

```js
new Client({ prefixes: ['!', '?', 'yap '] });

// Per-server prefixes (may be async)
new Client({ prefixes: async (message) => (await db.prefixFor(message.serverId)) ?? ['/', '!'] });
```

`@Bot ping` always works too (turn it off with `commands.mentionPrefix: false`).

When the same command exists on two bots, people can pick one (`/fish @YourBot`). yapin.js only answers when the bot was picked.

## Syncing with Yapin’

The list goes to Yapin’ on login. Commands added or removed later (modules loading, `register`, `unregister`) are re-sent a second after the last change. To do it yourself:

```js
await client.commands.sync();               // sends only if something changed
const live = await client.commands.fetchRemote();
```

Set `commands.autoSync: false` to manage it yourself.

## The built-in /help

`new Client({ commands: { help: true } })` adds `/help`. It lists commands grouped by category, and `/help <command>` shows usage, aliases, options, subcommands, cooldown and examples. An embed holds 10 fields, so with more than 10 categories the first 9 are listed and the rest are named in a last field; `/help <category>` lists one. Customise it with `help: { name: 'commands', color: 'Blurple', title: 'What I can do' }`. Or replace it entirely by registering your own `help` command.
