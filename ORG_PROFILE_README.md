<p align="center">
  <img src="https://raw.githubusercontent.com/yapin-js/yapin.js/main/YapinAssets/yapinjsicon.png" alt="yapin.js: JavaScript Development Framework" width="720">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/yapin.js"><img src="https://img.shields.io/npm/v/yapin.js?label=npm" alt="npm version"></a>
  <a href="https://github.com/yapin-js/yapin.js/actions/workflows/ci.yml"><img src="https://github.com/yapin-js/yapin.js/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/yapin-js/yapin.js/blob/main/LICENSE"><img src="https://img.shields.io/github/license/yapin-js/yapin.js" alt="MIT license"></a>
</p>

**yapin.js** is a fast, modular framework for building [Yapin’](https://www.yapin.gg) bots in JavaScript. If you've used discord.js, you already know most of it.

- **Zero dependencies.** Runs on Node 18+ with standard APIs only.
- **Familiar API.** `Client`, `Events`, managers with caches, `EmbedBuilder`, buttons, collectors, `message.reply()`.
- **Commands built in.** Typed options, subcommands, cooldowns, permission checks, middleware and a ready-made `/help`.
- **Reliable events.** WebSocket gateway with automatic fallback to polling. No dropped or repeated events.
- **The rest of Yapin’.** Components V2 layouts, reactions, voice and music bots, webhooks, and Login with Yapin’.
- **TypeScript types included.**

yapin.js is in **beta**. The API may still change before 1.0.

### Installation

#### 1. Install the package

```sh
npm install yapin.js
```

Or use `pnpm add yapin.js`, `yarn add yapin.js` or `bun add yapin.js`.

#### 2. Set up your project

You need **Node.js 18.17** or newer. Add `"type": "module"` to your `package.json`, or name your files `.mjs`.

#### 3. Get a bot token

In Yapin’, open **Settings → Developer**, type a name and press **Create**. Copy the token from the **Token** tab; it's only shown once. Never share it or commit it.

#### 4. Write your bot

```js
// bot.js
import { Client } from 'yapin.js';

const client = new Client();
client.command('ping', 'Check the bot is alive', (ctx) => ctx.reply('Pong!'));
client.login(process.env.YAPIN_TOKEN);
```

#### 5. Run it

Set the `YAPIN_TOKEN` environment variable to your token, then run:

```sh
node bot.js
```

#### Optional extras

| Package | When you need it |
| --- | --- |
| `ws` | The WebSocket gateway on Node 18 to 21. Node 22+ has it built in; without it, events arrive by polling. |
| `@livekit/rtc-node` and ffmpeg | Voice and music bots |

The [getting started guide](https://github.com/yapin-js/yapin.js/blob/main/docs/getting-started.md) walks through it all in more detail.

### Links

| | |
| --- | --- |
| 🌐 Website | [yapin.js.org](https://yapin.js.org) |
| 📦 npm | [yapin.js](https://www.npmjs.com/package/yapin.js) |
| 📖 Docs | [Getting started](https://github.com/yapin-js/yapin.js/blob/main/docs/getting-started.md) and the [full documentation](https://github.com/yapin-js/yapin.js/blob/main/docs/README.md) |
| 🤖 Examples | [Runnable bots](https://github.com/yapin-js/yapin.js/tree/main/examples) |
| 🏷️ Releases | [Changelog and downloads](https://github.com/yapin-js/yapin.js/releases) |

### Get involved

yapin.js is open source and built in the open. Every kind of help counts: reporting bugs, improving docs, writing examples, answering questions or sending code.

- **Have a question?** Ask in [Discussions](https://github.com/yapin-js/yapin.js/discussions).
- **Found a bug or have an idea?** [Open an issue](https://github.com/yapin-js/yapin.js/issues/new/choose).
- **Want to contribute code?** Read the [contributing guide](https://github.com/yapin-js/yapin.js/blob/main/CONTRIBUTING.md), then look for issues labelled [`good first issue`](https://github.com/yapin-js/yapin.js/labels/good%20first%20issue) or [`help wanted`](https://github.com/yapin-js/yapin.js/labels/help%20wanted).
- **Found a security problem?** Please report it privately, following the [security policy](https://github.com/yapin-js/yapin.js/security/policy). Don't open a public issue.

Everyone taking part is expected to follow the [Code of Conduct](https://github.com/yapin-js/yapin.js/blob/main/CODE_OF_CONDUCT.md).

### Repositories

| Repository | What it is |
| --- | --- |
| [yapin.js](https://github.com/yapin-js/yapin.js) | The framework, its docs and examples |
| [yapinjs](https://github.com/yapin-js/yapinjs) | The website at yapin.js.org |

<sub>yapin.js is a community project and is not affiliated with or endorsed by Yapin’. Released under the MIT License.</sub>
