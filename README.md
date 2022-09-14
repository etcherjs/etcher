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

To generate chisel (etcher's output js file), run:
```bash
etcher -b # build
etcher -w # watch
```

# Configuration
You can configure etcher by creating a `etcher.config.js` file in the root directory of your project. Here's an example:
```js
export default {
    srcDir: 'src',
    outDir: 'dist',
    // more config options will be added soon
}
```


# Example
```html
<!-- src/pages/index.html -->
<html>
  <body>
    <button-component></button-component>
  </body>
</html>
```

```html
<!-- src/components/buttonComponent.html -->
<button>Click me!</button>
```

# TODO
- [ ] Add support for props through attributes