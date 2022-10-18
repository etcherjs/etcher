# Etcher
A *✨ blazingly fast ✨* frontend 'framework' to create reusable web components without touching a single line of javascript.

# Why?
Etcher allows you to take advantage of custom elements, a feature [natively supported in **all** major browsers](https://developer.mozilla.org/en-US/docs/Web/API/Window/customElements#browser_compatibility).

Custom web elements have
- CSS Scoping through the Shadow DOM
- Reusability
- Extensibility

and much more.

# Installation
```bash
npm i @etcher/core -g
```

# Usage
To use etcher, you need to follow this directory structure:
```
├── src
│   ├── components
│   |   └── ...component html files
│   ├── pages
│   |   └── ...page html files
```

(You can configure these directories in the `etcher.config.js` file.)

To generate chisel, run:
```bash
etcher -b # build
etcher -w # watch
```

This will move all your pages into your `public` directory, and generate a `_chisel.js` file, which is the output of etcher.

# Configuration
You can configure etcher by creating a `etcher.config.js` file in the root directory of your project. Here's an example:
```js
export default {
    srcDir: 'src',
    outDir: 'dist',
    // more config options will be added soon:tm:
}
```

# Example
```html
<!-- src/pages/index.html -->
<html>
  <body>
    <!-- our `label` attribute will be passed to the button file -->
    <etcher-Button label="Click Me!"></etcher-Button>
  </body>
</html>
```

```html
<!-- src/components/Button.html -->
<button>{{label}}</button>
```

# TODO
- [x] Add support for props through attributes