<div align="center">
  <img src="https://etcherjs.vercel.app/assets/etcher.png" width="100"/>
</div>

<br/>

[size-img]: https://img.shields.io/bundlephobia/minzip/@etcher/core?color=d34ebb&style=for-the-badge
[latest-img]: https://img.shields.io/npm/v/@etcher/core/latest?color=d34ebb&label=latest&style=for-the-badge
[next-img]: https://img.shields.io/npm/v/@etcher/core/next?color=d34ebb&label=next&style=for-the-badge
[license-img]: https://img.shields.io/npm/l/@etcher/core?color=d34ebb&style=for-the-badge
[discord-img]: https://img.shields.io/badge/Discord-d34ebb?style=for-the-badge
[site-img]: https://img.shields.io/badge/EtcherJS-d34ebb?style=for-the-badge

[![EtcherJS][site-img]](https://etcherjs.vercel.app)
[![Discord][discord-img]](https://discord.gg/Vqd3BRFR5D)
[![Size][size-img]](https://bundlephobia.com/result?p=@etcher/core)
[![Latest][latest-img]](https://www.npmjs.com/package/@etcher/core)
[![Next][next-img]](https://www.npmjs.com/package/@etcher/core)
[![License][license-img]](https://github.com/etcherjs/etcher/tree/main/packages/core/LICENSE.md)

# Etcher

A _✨ blazingly fast ✨_ frontend 'framework' to create reusable web components without touching a single line of javascript.

# Why?

Etcher allows you to take advantage of custom elements, a feature [natively supported in **all** major browsers](https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements#browser_compatibility).

Ethcer's custom web elements have

-   CSS Scoping through the Shadow DOM
-   Event handling
-   Reusability
-   Reactivity

and much more.

# VS Code Extension

Etcher comes with a VS Code extension that allows you to access syntax highlighting, code completion, and more.

[![GitHub](https://img.shields.io/badge/GitHub-d34ebb?style=for-the-badge)](https://github.com/etcherjs/etcher/tree/main/packages/vscode-etcher)
[![Visual Studio Marketplace](https://img.shields.io/badge/Marketplace-d34ebb?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=TheCommieAxolotl.etcher-vscode)

# Installation

```bash
npm i @etcher/core -g
```

# Usage

To use etcher, you need to follow this directory structure:

```
├── src
│   ├── components
│   |   └── ...component xtml files
│   ├── pages
│   |   └── ...page xtml files
```

(You can configure these directories in the `etcher.config.js` file.)

To generate your pages, run:

```bash
etcher -b # build
etcher -w # watch
etcher <> -s # serve
```

This will move all your pages into your `public` directory and add the necessary scripts to them.

# Configuration

You can configure etcher by creating a `etcher.config.js` file in the root directory of your project. Here's an example:

```js
export default {
    input: 'src',
    output: 'dist',
    plugins: [
        // ...
    ],
};
```

# Example

```html
<!-- src/pages/index.xtml -->
<html>
    <body>
        <!-- our `label` attribute will be passed to the button file -->
        <etcher-Button label="Click Me!"></etcher-Button>
    </body>
</html>
```

```html
<!-- src/components/Button.xtml -->
<button>{{props.label}}</button>
```
