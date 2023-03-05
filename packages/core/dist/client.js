const error = (...message) => {
    console.error('%cetcher:%c', 'color: hsl(350, 89%, 72%); font-weight: 600', '', ...message);
};
const warn = (...message) => {
    console.warn('%cetcher:%c', 'color: hsl(40, 89%, 72%); font-weight: 600', '', ...message);
};

const onMount = (callback) => {
    return callback;
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
const insert = (id, node, template, content, dependencies) => {
    try {
        if (!node)
            return;
        const addingAttribute = typeof dependencies === 'string';
        let insertContent = content;
        try {
            typeof content === 'function' && (insertContent = content());
        }
        catch (e) {
            node.replaceWith(`{{${content}}}`);
            return warn(`Error evaluating interpolated expression:\n\n{{${String(content).replace('() => ', '')}}}\n  ${'^'.repeat(String(content).replace('() => ', '').length)}\n\n${e.message}`);
        }
        Array.isArray(insertContent) && (insertContent = insertContent[0]);
        if (dependencies && !addingAttribute) {
            for (let i = 0; i < dependencies.length; i++) {
                if (!dependencies[i])
                    dependencies[i] = {};
                if (dependencies[i].$$$interval) {
                    return;
                }
                const interval = () => {
                    const newContent = content();
                    if (newContent !== insertContent) {
                        insert('ETCHER-DEPENDENCY', node, template, content);
                        insertContent = newContent;
                    }
                };
                dependencies[i].$$$interval = window.setInterval(interval, 100);
            }
        }
        if (typeof insertContent === 'undefined')
            return;
        if (addingAttribute) {
            let colonSeparated = [];
            if (!(node instanceof HTMLElement))
                return;
            colonSeparated = dependencies.split(':');
            if (colonSeparated.length > 1) {
                switch (colonSeparated[0]) {
                    case 'style': {
                        node.style[colonSeparated[1]] = insertContent;
                        break;
                    }
                    default: {
                        error(`Unknown attribute type: ${colonSeparated[0]}`);
                        break;
                    }
                }
                return;
            }
            node.setAttribute(dependencies, insertContent);
            return;
        }
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
    transform(id, () => [temp]);
};

const wrappedEval = (code, params) => {
    try {
        const res = new Function(...Object.keys(params || {}), 'return ' + code)(...Object.values(params || {}));
        return res;
    }
    catch (e) {
        warn(`Error while evaluating expression: ${code}`);
        return false;
    }
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

const CONSTRUCTOR_INDEXES = new Map();
class EtcherElement extends HTMLElement {
    __etcher_id;
    __callbacks;
    constructor(template, etcher_id) {
        super();
        CONSTRUCTOR_INDEXES.set(etcher_id, (CONSTRUCTOR_INDEXES.get(etcher_id) || 0) + 1);
        this.__etcher_id = etcher_id;
        const shadow = this.attachShadow({
            mode: 'open',
        });
        const [fragment, ...callbacks] = template(CONSTRUCTOR_INDEXES.get(etcher_id) || 0, shadow);
        this.__callbacks = callbacks;
        shadow.appendChild(fragment);
        this.registerProps();
    }
    async registerProps() {
        // NOTE: Not the best implementation, but works with the current system.
        const index = CONSTRUCTOR_INDEXES.get(this.__etcher_id);
        const moduleExports = await import(/* @vite-ignore */ `/@etcher/${this.__etcher_id}.js`);
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            if (!moduleExports.props[index])
                moduleExports.props[index] = {};
            Object.defineProperty(moduleExports.props[index], attr.name, {
                get: () => attr.value,
                set: (value) => {
                    attr.value = value;
                },
            });
        }
    }
    connectedCallback() {
        for (let i = 0; i < this.__callbacks.length; i++) {
            this.__callbacks[i](this.shadowRoot);
        }
    }
}
const transform = (id, body) => {
    window.customElements.define(id, class extends EtcherElement {
        constructor() {
            super(body, id);
            window._$etcherCore.c[id] = this;
        }
    });
};
class STD_ELEMENT_FOR extends HTMLElement {
    __items;
    __label;
    constructor() {
        super();
        const items = wrappedEval(this.getAttribute('items')) || wrappedEval(this.getAttribute('default')) || [];
        const label = this.getAttribute('label') || 'item';
        this.__items = items;
        this.__label = label;
    }
    connectedCallback() {
        const template = document.createElement('template');
        template.innerHTML = this.innerHTML;
        this.innerHTML = '';
        const content = template.content;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < this.__items.length; i++) {
            const clone = document.importNode(content, true);
            const replaceNode = (node) => {
                if (!node.textContent)
                    return;
                const text = node.textContent;
                if (!text)
                    return;
                const regex = new RegExp(`{{(([^}]*?)(${this.__label})(.*?))}}`, 'gs');
                let expression = regex.exec(text);
                while (expression) {
                    if (expression[1].startsWith('() => ')) {
                        expression[1] = expression[1].replace('() => ', '');
                    }
                    const res = wrappedEval(expression[1], {
                        [this.__label || 'item']: this.__items[i],
                    });
                    if (res === undefined)
                        return;
                    node.textContent = text.replace(expression[0], res);
                    expression = regex.exec(text);
                }
            };
            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];
                replaceNode(node);
            }
            fragment.appendChild(clone);
        }
        this.appendChild(fragment.cloneNode(true));
    }
}
class STD_ELEMENT_LOOP extends HTMLElement {
    __iterations;
    constructor() {
        super();
        const iterations = this.getAttribute('iterations') || this.getAttribute('default');
        this.__iterations = Number(iterations);
    }
    connectedCallback() {
        const template = document.createElement('template');
        template.innerHTML = this.innerHTML;
        this.innerHTML = '';
        const content = template.content;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < this.__iterations; i++) {
            const clone = document.importNode(content, true);
            const replaceNode = (node) => {
                if (!node.textContent)
                    return;
                const text = node.textContent;
                if (!text)
                    return;
                const regex = new RegExp(`{{(([^}]*?)(index)(.*?))}}`, 'gs');
                let expression = regex.exec(text);
                while (expression) {
                    if (expression[1].startsWith('() => ')) {
                        expression[1] = expression[1].replace('() => ', '');
                    }
                    const res = wrappedEval(expression[1], {
                        ['index']: i,
                    });
                    if (res === undefined)
                        return;
                    node.textContent = text.replace(expression[0], res);
                    expression = regex.exec(text);
                }
            };
            for (let j = 0; j < clone.childNodes.length; j++) {
                const node = clone.childNodes[j];
                replaceNode(node);
            }
            fragment.appendChild(clone);
        }
        this.appendChild(fragment.cloneNode(true));
    }
}
class STD_ELEMENT_IF extends HTMLElement {
    __condition;
    constructor() {
        super();
        const condition = wrappedEval(this.getAttribute('condition')) || wrappedEval(this.getAttribute('default'));
        this.__condition = Boolean(condition);
    }
    connectedCallback() {
        const template = document.createElement('template');
        template.innerHTML = this.innerHTML;
        this.innerHTML = '';
        const content = template.content;
        const fragment = document.createDocumentFragment();
        if (this.__condition) {
            const clone = document.importNode(content, true);
            fragment.appendChild(clone);
        }
        this.appendChild(fragment);
    }
}

window._$etcherCore = {
    c: {},
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
    onMount,
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
