# Modules

A module groups the commands, buttons, event listeners and timers for one feature, usually one file each: `modules/fun.js`, `modules/moderation.js`. discord.py and the yapper SDK call these cogs.

Everything a module registers belongs to it. Unloading takes it all out again, and reloading reads the file fresh without restarting the bot. Errors are tagged with the module's name so the logs say where it broke.

```js
// bot.js
import { Client } from 'yapin.js';

const client = new Client();
await client.modules.load('./modules'); // every .js in the folder, A to Z (files starting with _ are skipped)
await client.login();
```

## A module as a class

```js
// modules/fun.js
import { Module, ActionRowBuilder, ButtonBuilder } from 'yapin.js';

const JOKES = ['I know a UDP joke, but you might not get it.', 'There are 10 kinds of people…'];

export default class Fun extends Module {
  // Optional: the module's name. Defaults to the file name ('fun').
  name = 'fun';

  commands = [
    {
      name: 'joke',
      description: 'Tell a joke',
      run: (ctx) => ctx.reply({ content: this.pick(), components: [new ActionRowBuilder(ButtonBuilder.secondary('Another', 'joke:again'))] }),
    },
  ];

  buttons = {
    'joke:again': (i) => i.update({ content: this.pick() }),
  };

  events = {
    serverMemberAdd: (member) => this.logger.info(`${member.displayName} joined ${member.server.name}`),
  };

  pick() {
    return JOKES[Math.floor(Math.random() * JOKES.length)];
  }

  // Optional: false or a reason string stops this module's commands.
  check(ctx) {
    return ctx.channel.name !== 'serious-discussion' || 'Not in here!';
  }

  // Optional: runs after everything above is registered.
  load() {
    this.setInterval(() => this.logger.debug('still funny'), 60_000); // cleared on unload
  }

  // Optional: runs on unload and reload.
  unload() {}
}
```

Inside a module, `this.client`, `this.logger` (prefixed with the module name) and the helpers below are available. Use arrow functions in fields, as above, so `this` is the module.

`commands` can also be an object: `{ joke: { description, run }, ping: (ctx) => … }`.

## A module as an object

```js
// modules/moderation.js
import { defineModule } from 'yapin.js';
import { kick, ban, timeout } from './_commands.js'; // _files aren't loaded as modules

export default defineModule({
  name: 'moderation',
  commands: [kick, ban, timeout],
  events: {
    messageCreate(message) {
      if (/discord\.gg\//i.test(message.content)) message.delete().catch(() => {});
    },
  },
  check: (ctx) => ctx.inServer() || 'Moderation commands only work in servers.',
  setup(ctx) {
    ctx.setInterval(() => cleanupExpiredWarnings(), 60_000);
  },
  teardown(ctx) {},
});
```

Or the shortest form: `export function setup(ctx) { ctx.command({...}); ctx.on('messageCreate', ...); }`.

## The module context

`setup(ctx)` gets a `ModuleContext`. Class modules can use the same methods on `this`, and so can the functions of a `defineModule({…})` (`this` is the definition, with `this.client`, `this.logger` and the helpers added):

| | |
| --- | --- |
| `ctx.client`, `ctx.name`, `ctx.logger` | |
| `ctx.command(definition)` | Register a command owned by the module |
| `ctx.on(event, fn)`, `ctx.once(event, fn)` | Listen to a client event |
| `ctx.button(pattern, fn)` | Route button clicks |
| `ctx.setTimeout(fn, ms)`, `ctx.setInterval(fn, ms)` | Timers that are cleared on unload |
| `ctx.onUnload(fn)` | Run something on unload (close a database, clear a cache) |

Use these instead of `client.on(…)` inside modules, or unloading can't take the listeners out.

## Loading, unloading, reloading

```js
await client.modules.load('./modules/fun.js');   // one file (the .js can be left out)
await client.modules.load('./modules');          // a folder
await client.modules.add(Fun);                   // a class or definition made in code
client.modules.get('fun');                       // { name, file, loadedAt, … }

await client.modules.unload('fun');
await client.modules.reload('fun');              // reads modules/fun.js again
await client.modules.reloadAll();
```

If the new version fails to load, the old one is put back and the error is thrown, so a typo doesn't take a feature down. Commands added or removed are sent to Yapin’ by themselves.

Files that a module imports itself (like `./_commands.js`) aren't re-read on reload; restart for those.

Paths are relative to your main file, then the current folder. URLs work too: `new URL('./modules/fun.js', import.meta.url)`.

### Watch mode

While you work, reload on save:

```js
if (process.env.NODE_ENV !== 'production') client.modules.watch();
```

This watches every loaded module file and every [command file](commands.md#command-files). It returns a function that stops watching.

### A /reload command

```js
client.commands.register({
  name: 'reload',
  ownerOnly: true,
  hidden: true,
  options: [{ name: 'module', required: true }],
  async run(ctx) {
    await client.modules.reload(ctx.values.module);
    await ctx.reply(`Reloaded ${ctx.values.module}`);
  },
});
```

## Names and conflicts

A module's name is its `name`, else the file name. Two modules with the same name, or the same command name in two modules, is an error that names both files.
