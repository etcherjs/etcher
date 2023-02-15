const wrappedEval = (code) => {
    return new Function('return ' + code)();
};
const createSignal = (value) => {
    let currentValue = value;
    let accessors = [];
    const signal = (node) => {
        if (node) {
            accessors.push(node);
            insert('ETCHER-SIGNAL', wrappedEval(node), null, () => currentValue);
        }
        return currentValue;
    };
    const setSignal = (value) => {
        currentValue = value;
        for (let i = 0; i < accessors.length; i++) {
            const node = accessors[i];
            insert('ETCHER-SIGNAL', wrappedEval(node), null, () => currentValue);
        }
    };
    const accessor = (node) => {
        accessors.push(node);
    };
    return [signal, setSignal, accessor];
};

class EtcherElement extends HTMLElement {
    constructor(template) {
        super();
        const shadow = this.attachShadow({
            mode: 'open',
        });
        shadow.appendChild(template);
    }
}
const transform = (id, body) => {
    window.customElements.define(id, class extends EtcherElement {
        constructor() {
            super(body);
            window._$etcherCore.c[id] = this;
        }
    });
};
class STD_ELEMENT_FOR extends HTMLElement {
    constructor() {
        super();
        const items = wrappedEval(this.getAttribute('items'));
        const label = this.getAttribute('label');
        const shadow = this.attachShadow({
            mode: 'open',
        });
        const template = document.createElement('template');
        template.innerHTML = this.innerHTML;
        const content = template.content;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < items.length; i++) {
            const clone = document.importNode(content, true);
            const replaceNode = (node) => {
                if (node.textContent) {
                    const text = node.textContent;
                    if (text) {
                        node.textContent = text.replace(new RegExp(`{{([^}]*?)(${label})(.*?)}}`, 'gs'), items[i]);
                    }
                }
            };
            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];
                replaceNode(node);
            }
            fragment.appendChild(clone);
        }
        shadow.appendChild(fragment);
    }
}
class STD_ELEMENT_LOOP extends HTMLElement {
    constructor() {
        super();
        const iterations = this.getAttribute('iterations');
        const shadow = this.attachShadow({
            mode: 'open',
        });
        const template = document.createElement('template');
        template.innerHTML = this.innerHTML;
        const content = template.content;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < Number(iterations); i++) {
            const clone = document.importNode(content, true);
            const replaceNode = (node) => {
                if (node.textContent) {
                    const text = node.textContent;
                    if (text) {
                        node.textContent = text.replace(new RegExp(`{{([^}]*index*?)}}`, 'gs'), i.toString());
                    }
                }
            };
            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];
                replaceNode(node);
            }
            fragment.appendChild(clone);
        }
        shadow.appendChild(fragment);
    }
}
class STD_ELEMENT_IF extends HTMLElement {
    constructor() {
        super();
        const condition = wrappedEval(this.getAttribute('condition'));
        const shadow = this.attachShadow({
            mode: 'open',
        });
        const template = document.createElement('template');
        template.innerHTML = this.innerHTML;
        const content = template.content;
        const fragment = document.createDocumentFragment();
        if (condition) {
            const clone = document.importNode(content, true);
            fragment.appendChild(clone);
        }
        shadow.appendChild(fragment);
    }
}

const error = (...message) => {
    console.error('%cetcher:%c', 'color: hsl(350, 89%, 72%); font-weight: 600', '', ...message);
};
const warn = (...message) => {
    console.warn('%cetcher:%c', 'color: hsl(40, 89%, 72%); font-weight: 600', '', ...message);
};

const template = (id, body) => {
    try {
        const template = document.createElement('template');
        template.innerHTML = body;
        return template.content;
    }
    catch (e) {
        error(`Error parsing template: `, e);
        renderError(id, e);
    }
};
const listen = (id, node, callback, event) => {
    try {
        node[`$$${event}`] = callback;
        node.addEventListener(event, callback);
    }
    catch (e) {
        error(`Error listening to event: `, e);
        renderError(id, e);
    }
};
const insert = (id, node, template, content) => {
    try {
        if (!node)
            return;
        let insertContent = content;
        try {
            typeof content === 'function' && (insertContent = content());
        }
        catch (e) {
            node.replaceWith(`{{${content}}}`);
            return warn(`Error evaluating expression: `, e);
        }
        typeof insertContent === 'undefined' && (insertContent = node.textContent);
        Array.isArray(insertContent) && (insertContent = insertContent[0]);
        node.replaceWith(insertContent);
    }
    catch (e) {
        error(`Error inserting interpolated expression: `, e);
        renderError(id, e);
    }
};
const renderError = (id, error) => {
    const markup = `<div style="color: #ff4c4c; font-family: monospace; font-size: 14px; padding: 20px; background: #aaaaaa1c; border: 2px solid #e5e5e570; border-radius: 5px; margin: 10px 0; max-width: 900px;">
        <span style="white-space: break-spaces;">Error while rendering component: ${error.message}</span>
        <br />
        <br />
        <div style="font-size: 12px; color: #8a8989; font-family: monospace; whitespace: pre-wrap;">
            ${error.stack.split('\n').join('<br />')}
        </div>
        </div>`;
    const temp = template(id, markup);
    transform(id, temp);
};

window._$etcherCore = {
    c: {},
    l: {},
    transform,
    template,
    listen,
    insert,
    web: {
        createSignal,
    },
};
window.etcher = {
    createSignal,
};
window.customElements.define('etcher-std-if', STD_ELEMENT_IF);
window.customElements.define('etcher-std-for', STD_ELEMENT_FOR);
window.customElements.define('etcher-std-loop', STD_ELEMENT_LOOP);
var index = {
    Element: EtcherElement,
    transform,
    template,
    listen,
    insert,
    createSignal,
};

export { index as default };
