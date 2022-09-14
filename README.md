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
npm i etcher -g
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
<!-- src/index.html -->
<html>
  <head>
    <link rel="stylesheet" href="main.css">
  </head>
  <body>
    <button-component></button-component>
    <script src="main.js"></script>
  </body>
</html>
```

```html
<!-- src/components/button/button.html -->
<button>Click me!</button>
```

```css
/* src/components/button/button.css */
button {
  background: #000;
  color: #fff;
}
```

```js
// src/main.js
import { register } from 'etcher';

register('button-component', 'button');
```

# TODO
- [ ] Add support for props through attributes