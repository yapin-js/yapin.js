# yapin.js embeds for YapHook

One message made of five embeds that introduces yapin.js: a banner, features, step-by-step installation, links, and how to contribute. Everything uses the formatting YapHook supports ([formatting reference](https://yaphook.dev/#help/formatting)), so there is no HTML and no tables.

## Fastest way: import it

1. Open [yaphook.dev](https://yaphook.dev) and go to **Backup / import JSON**.
2. Paste the JSON from [the end of this file](#import-json) and apply it.
3. Check the preview, add your webhook URL, and press **Send**.

## Or fill it in by hand

Set **Username** to `yapin.js`. Then add one embed per section below. Every embed uses the colour `#FF6B4A`. Copy each code block into the field it is named after.

### Embed 1: yapin.js

- **Title:** `yapin.js`
- **Title URL:** `https://github.com/yapin-js/yapin.js`
- **Colour:** `#FF6B4A`
- **Image URL:** `https://raw.githubusercontent.com/yapin-js/yapin.js/main/YapinAssets/yapinjsicon.png`

**Description:**

```md
A fast, modular framework for building **Yapin’** bots in JavaScript.
If you've used discord.js, you already know most of it.

-# Beta · v0.1.3 · MIT licensed
```

### Embed 2: Why yapin.js

- **Title:** `Why yapin.js`
- **Colour:** `#FF6B4A`

**Fields** (tick **Inline** on all of them, so they sit three to a row):

1. Name: `Zero dependencies`  
   Value: `Runs on Node 18+ using standard APIs only.`
2. Name: `Familiar API`  
   Value: `` `Client`, `Events`, `EmbedBuilder`, collectors and `message.reply()`. ``
3. Name: `Commands built in`  
   Value: `` Typed options, subcommands, cooldowns, permission checks and `/help`. ``
4. Name: `Reliable events`  
   Value: `WebSocket gateway with automatic fallback to polling. Nothing dropped or repeated.`
5. Name: `All of Yapin’`  
   Value: `Buttons, Components V2, voice and music bots, webhooks and OAuth2.`
6. Name: `TypeScript ready`  
   Value: `Full types included, so you get autocomplete in JavaScript too.`

### Embed 3: Installation

- **Title:** `Installation`
- **Title URL:** `https://github.com/yapin-js/yapin.js/blob/main/docs/getting-started.md`
- **Colour:** `#FF6B4A`

**Description:**

````md
### 1. Install the package
```sh
npm install yapin.js
```
-# Or `pnpm add yapin.js`, `yarn add yapin.js` or `bun add yapin.js`.

### 2. Set up your project
You need **Node.js 18.17** or newer. Add `"type": "module"` to your `package.json`, or name your files `.mjs`.

### 3. Get a bot token
In Yapin’, open **Settings → Developer**, type a name and press **Create**. Copy the token from the **Token** tab; it's only shown once. Never share it or commit it.

### 4. Write your bot
```js
// bot.js
import { Client } from 'yapin.js';

const client = new Client();
client.command('ping', 'Check the bot is alive', (ctx) => ctx.reply('Pong!'));
client.login(process.env.YAPIN_TOKEN);
```
### 5. Run it
Set the `YAPIN_TOKEN` environment variable to your token, then run:
```sh
node bot.js
```
### Optional extras
- `ws` for the WebSocket gateway on Node 18 to 21 (Node 22+ has it built in; without it, events arrive by polling)
- `@livekit/rtc-node` and ffmpeg for voice and music bots

Full walkthrough: [getting started guide](https://github.com/yapin-js/yapin.js/blob/main/docs/getting-started.md)
````

### Embed 4: Links

- **Title:** `Links`
- **Colour:** `#FF6B4A`

**Fields** (tick **Inline** on all of them, so they sit three to a row):

1. Name: `Website`  
   Value: `[yapin.js.org](https://yapin.js.org)`
2. Name: `npm`  
   Value: `[yapin.js](https://www.npmjs.com/package/yapin.js)`
3. Name: `Source`  
   Value: `[GitHub](https://github.com/yapin-js/yapin.js)`
4. Name: `Docs`  
   Value: `[Documentation](https://github.com/yapin-js/yapin.js/blob/main/docs/README.md)`
5. Name: `Examples`  
   Value: `[Runnable bots](https://github.com/yapin-js/yapin.js/tree/main/examples)`
6. Name: `Releases`  
   Value: `[Changelog](https://github.com/yapin-js/yapin.js/releases)`

### Embed 5: Get involved

- **Title:** `Get involved`
- **Colour:** `#FF6B4A`
- **Footer:** `yapin.js · MIT licensed · Open source on GitHub`

**Description:**

```md
yapin.js is open source, and every kind of help counts.

- **Questions?** Ask in [Discussions](https://github.com/yapin-js/yapin.js/discussions)
- **Found a bug or have an idea?** [Open an issue](https://github.com/yapin-js/yapin.js/issues/new/choose)
- **Want to write code?** Read the [contributing guide](https://github.com/yapin-js/yapin.js/blob/main/CONTRIBUTING.md) and pick up a [good first issue](https://github.com/yapin-js/yapin.js/labels/good%20first%20issue)
- **Security problem?** Report it [privately](https://github.com/yapin-js/yapin.js/security/policy), never in a public issue

-# Everyone taking part follows the [Code of Conduct](https://github.com/yapin-js/yapin.js/blob/main/CODE_OF_CONDUCT.md).
```

## Import JSON

````json
{
  "version": "yaphook-1",
  "messages": [
    {
      "data": {
        "username": "yapin.js",
        "embeds": [
          {
            "title": "yapin.js",
            "url": "https://github.com/yapin-js/yapin.js",
            "description": "A fast, modular framework for building **Yapin’** bots in JavaScript.\nIf you've used discord.js, you already know most of it.\n\n-# Beta · v0.1.3 · MIT licensed",
            "color": 16739146,
            "image": {
              "url": "https://raw.githubusercontent.com/yapin-js/yapin.js/main/YapinAssets/yapinjsicon.png"
            }
          },
          {
            "title": "Why yapin.js",
            "color": 16739146,
            "fields": [
              {
                "name": "Zero dependencies",
                "value": "Runs on Node 18+ using standard APIs only.",
                "inline": true
              },
              {
                "name": "Familiar API",
                "value": "`Client`, `Events`, `EmbedBuilder`, collectors and `message.reply()`.",
                "inline": true
              },
              {
                "name": "Commands built in",
                "value": "Typed options, subcommands, cooldowns, permission checks and `/help`.",
                "inline": true
              },
              {
                "name": "Reliable events",
                "value": "WebSocket gateway with automatic fallback to polling. Nothing dropped or repeated.",
                "inline": true
              },
              {
                "name": "All of Yapin’",
                "value": "Buttons, Components V2, voice and music bots, webhooks and OAuth2.",
                "inline": true
              },
              {
                "name": "TypeScript ready",
                "value": "Full types included, so you get autocomplete in JavaScript too.",
                "inline": true
              }
            ]
          },
          {
            "title": "Installation",
            "url": "https://github.com/yapin-js/yapin.js/blob/main/docs/getting-started.md",
            "description": "### 1. Install the package\n```sh\nnpm install yapin.js\n```\n-# Or `pnpm add yapin.js`, `yarn add yapin.js` or `bun add yapin.js`.\n\n### 2. Set up your project\nYou need **Node.js 18.17** or newer. Add `\"type\": \"module\"` to your `package.json`, or name your files `.mjs`.\n\n### 3. Get a bot token\nIn Yapin’, open **Settings → Developer**, type a name and press **Create**. Copy the token from the **Token** tab; it's only shown once. Never share it or commit it.\n\n### 4. Write your bot\n```js\n// bot.js\nimport { Client } from 'yapin.js';\n\nconst client = new Client();\nclient.command('ping', 'Check the bot is alive', (ctx) => ctx.reply('Pong!'));\nclient.login(process.env.YAPIN_TOKEN);\n```\n### 5. Run it\nSet the `YAPIN_TOKEN` environment variable to your token, then run:\n```sh\nnode bot.js\n```\n### Optional extras\n- `ws` for the WebSocket gateway on Node 18 to 21 (Node 22+ has it built in; without it, events arrive by polling)\n- `@livekit/rtc-node` and ffmpeg for voice and music bots\n\nFull walkthrough: [getting started guide](https://github.com/yapin-js/yapin.js/blob/main/docs/getting-started.md)",
            "color": 16739146
          },
          {
            "title": "Links",
            "color": 16739146,
            "fields": [
              {
                "name": "Website",
                "value": "[yapin.js.org](https://yapin.js.org)",
                "inline": true
              },
              {
                "name": "npm",
                "value": "[yapin.js](https://www.npmjs.com/package/yapin.js)",
                "inline": true
              },
              {
                "name": "Source",
                "value": "[GitHub](https://github.com/yapin-js/yapin.js)",
                "inline": true
              },
              {
                "name": "Docs",
                "value": "[Documentation](https://github.com/yapin-js/yapin.js/blob/main/docs/README.md)",
                "inline": true
              },
              {
                "name": "Examples",
                "value": "[Runnable bots](https://github.com/yapin-js/yapin.js/tree/main/examples)",
                "inline": true
              },
              {
                "name": "Releases",
                "value": "[Changelog](https://github.com/yapin-js/yapin.js/releases)",
                "inline": true
              }
            ]
          },
          {
            "title": "Get involved",
            "description": "yapin.js is open source, and every kind of help counts.\n\n- **Questions?** Ask in [Discussions](https://github.com/yapin-js/yapin.js/discussions)\n- **Found a bug or have an idea?** [Open an issue](https://github.com/yapin-js/yapin.js/issues/new/choose)\n- **Want to write code?** Read the [contributing guide](https://github.com/yapin-js/yapin.js/blob/main/CONTRIBUTING.md) and pick up a [good first issue](https://github.com/yapin-js/yapin.js/labels/good%20first%20issue)\n- **Security problem?** Report it [privately](https://github.com/yapin-js/yapin.js/security/policy), never in a public issue\n\n-# Everyone taking part follows the [Code of Conduct](https://github.com/yapin-js/yapin.js/blob/main/CODE_OF_CONDUCT.md).",
            "color": 16739146,
            "footer": {
              "text": "yapin.js · MIT licensed · Open source on GitHub"
            }
          }
        ]
      }
    }
  ]
}
````
