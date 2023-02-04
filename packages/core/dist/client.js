const formatVariableName = (name) => {
    return name.replace(/\W/g, '_');
};
const replaceEntities = (str) => {
    str = str.replaceAll('&quot;', '"');
    str = str.replaceAll('&apos;', "'");
    str = str.replaceAll('&lt;', '<');
    str = str.replaceAll('&gt;', '>');
    str = str.replaceAll('&amp;', '&');
    str = str.replaceAll('&grave;', '`');
    return str;
};
const wrappedEval = (expression, arg, namedArg, prepend) => {
    if (arg) {
        if (namedArg) {
            return typeof new Function(namedArg, `"use strict"\n${prepend || ''}\n;return (${expression})`)(arg) ===
                'function'
                ? new Function(namedArg, `"use strict"\n${prepend || ''}\n;return (${expression})`)(arg)(arg)
                : new Function(namedArg, `"use strict"\n${prepend || ''}\n;return (${expression})`)(arg);
        }
        return typeof Function(`"use strict"\n${prepend || ''}\n;return (${expression})`)(arg) === 'function'
            ? Function(`"use strict"\n${prepend || ''}\n;return (${expression})`)(arg)(arg)
            : Function(`"use strict"\n${prepend || ''}\n;return (${expression})`)(arg);
    }
    return Function(`"use strict";\n${prepend || ''}\nreturn (${expression})`)();
};
const parseJSON = (obj) => {
    obj = obj.replace(/,(?=\s*})/, '');
    obj = obj.replace(/'/g, '"');
    obj = obj.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
    return JSON.parse(obj);
};
const loopMatches = (iterator, callback) => {
    for (let i = 0; i < iterator.length; i++) {
        callback(iterator[i], i);
    }
};

const parseExpression = (doc, rgx) => {
    const res = [];
    let match = rgx.exec(doc);
    while (match != null) {
        res.push(match);
        match = rgx.exec(doc);
    }
    return res;
};
const parseBetweenPairs = (index, chars, doc) => {
    let open = 0;
    let close = 0;
    let start = 0;
    let end = 0;
    for (let i = index; i < doc.length; i++) {
        if (chars[0].length > 1) {
            if (doc.substring(i, i + chars[0].length) === chars[0]) {
                if (open === 0) {
                    start = i;
                }
                open++;
            }
            else if (doc.substring(i, i + chars[1].length) === chars[1]) {
                close++;
                if (open === close) {
                    end = i;
                    break;
                }
            }
            continue;
        }
        if (doc[i] === chars[0]) {
            if (open === 0) {
                start = i;
            }
            open++;
        }
        else if (doc[i] === chars[1]) {
            close++;
            if (open === close) {
                end = i;
                break;
            }
        }
    }
    return doc.substring(start, end + chars[1].length);
};

const html = (body) => {
    const div = document.createElement('div');
    div.setAttribute('_etcher_root_', 'true');
    div.innerHTML = body;
    return div.children;
};
const replace = (element, find, replace) => {
    const html = element.innerHTML;
    element.innerHTML = html.replace(find, replace);
    return element;
};
const map = (body, orignalBody) => {
    const collection = html(body);
    let index = 0;
    return Array.from(collection).map((element, i) => {
        let selector = ``;
        index = (orignalBody ? orignalBody : body).indexOf(element.outerHTML, index);
        const attributes = {};
        for (const attribute of element.attributes) {
            attributes[attribute.name] = attribute.value;
        }
        const tag = element.tagName.toLowerCase();
        const content = element.innerHTML;
        const contentLength = content.length;
        const indexRange = [index, index + element.outerHTML.length];
        index += element.outerHTML.split(element.innerHTML)[0].length;
        index += contentLength;
        index += element.outerHTML.split(element.innerHTML)[1].length;
        const children = element.children.length ? map(element.innerHTML, orignalBody ? orignalBody : body) : [];
        selector += tag;
        if (attributes.id)
            selector += `#${attributes.id}`;
        if (attributes.class)
            selector += `.${attributes.class}`;
        return {
            element,
            attributes,
            tag,
            content,
            contentLength,
            indexRange,
            children,
            selector,
        };
    });
};
const parent = (body, stringIndex) => {
    const dom = map(body);
    const children = (ele) => {
        const val = ele.children.some((child) => {
            const [start, end] = child.indexRange;
            if (stringIndex >= start && stringIndex <= end) {
                return true;
            }
            if (child.children.length) {
                return children(child);
            }
        });
        return val;
    };
    const find = (dom, stringIndex) => {
        for (const element of dom) {
            const [start, end] = element.indexRange;
            if (stringIndex >= start && stringIndex <= end) {
                if (element.children.length) {
                    if (children(element)) {
                        return find(element.children, stringIndex);
                    }
                    else {
                        return element;
                    }
                }
                else {
                    return element;
                }
            }
        }
        return null;
    };
    const element = find(dom, stringIndex);
    return element ? element.element : null;
};
const selector = (tree, element) => {
    let path = ``;
    const isElement = (ele) => {
        const tags = ele.element.tagName === element.tagName;
        const classes = ele.element.className === element.className;
        const ids = ele.element.id === element.id;
        const innerHTML = ele.element.innerHTML === element.innerHTML;
        return tags && classes && ids && innerHTML;
    };
    const find = (tree, element) => {
        for (const ele of tree) {
            if (isElement(ele)) {
                return ele;
            }
            if (ele.children.length) {
                const child = find(ele.children);
                if (child) {
                    return child;
                }
            }
        }
        return null;
    };
    const elementPath = find(tree);
    if (elementPath) {
        const { selector } = elementPath;
        path += selector;
    }
    return path;
};

const error = (...message) => {
    console.error('%cetcher:%c', 'color: hsl(350, 89%, 72%); font-weight: 600', '', ...message);
};
const warn = (...message) => {
    console.warn('%cetcher:%c', 'color: hsl(40, 89%, 72%); font-weight: 600', '', ...message);
};

const EtcherElement = class extends HTMLElement {
    _listeners = {};
    _lexicalScope = {};
    _$etcherCoreInstance = null;
    constructor(component_body, component_id) {
        super();
        let state = 'pending';
        const stop = () => {
            if (state === 'pending') {
                state = 'stopped';
            }
        };
        this._$etcherCoreInstance = {
            name: component_id,
            content: component_body,
            instance: this,
            scripts: [],
        };
        window._$etcherCore.c[component_id] = this;
        try {
            const scripts = component_body.match(/<script>(.*?)<\/script>/gs);
            if (scripts) {
                for (let i = 0; i < scripts.length; i++) {
                    const script = scripts[i];
                    let scriptContent = `const $ = {
                        ...window._$etcherCore.c['${component_id}']._lexicalScope,
                    };${script.replace(/<script>|<\/script>/g, '')}`;
                    const interpolated = scriptContent.replace(/\$([a-zA-Z0-9_]+)/g, (match, p1) => {
                        if (match === '$etcherCore')
                            return match;
                        if (this.hasAttribute('#' + p1.trim())) {
                            let value = this.getAttribute('#' + p1.trim());
                            value = replaceEntities(value);
                            if (value.startsWith('{') || value.startsWith('[')) {
                                try {
                                    value = JSON.parse(value);
                                }
                                catch (e) {
                                    try {
                                        value = parseJSON(value);
                                    }
                                    catch (e) {
                                        error(`Error parsing JSON in computed attribute #${p1.trim()}:`, e);
                                    }
                                }
                            }
                            value = wrappedEval(value);
                            return value;
                        }
                        if (this.hasAttribute(p1.trim())) {
                            let value = this.getAttribute(p1.trim());
                            return value;
                        }
                        return p1;
                    });
                    const func = wrappedEval('(async () => { ' + interpolated + ' })');
                    this._$etcherCoreInstance.scripts.push(func);
                }
            }
            component_body = component_body.replaceAll(/\{\{(.*)\}\}/g, (match, _p1) => {
                const p1 = parseBetweenPairs(0, ['{{', '}}'], match).replace(/^\{\{/, '').replace(/\}\}$/, '');
                const expression = p1.split('.')[0].trim();
                if (this.hasAttribute('#' + expression)) {
                    let value = this.getAttribute('#' + expression);
                    value = replaceEntities(value);
                    if (value.startsWith('{') || value.startsWith('[')) {
                        try {
                            value = JSON.parse(value);
                        }
                        catch (e) {
                            try {
                                value = parseJSON(value);
                            }
                            catch (e) {
                                error('Could not parse JSON:', e);
                            }
                        }
                    }
                    if (p1.split('.').length > 1) {
                        return wrappedEval(p1, value, p1.split('.')[0]);
                    }
                    value = wrappedEval(value);
                    return value;
                }
                if (expression === '$') {
                    let ret;
                    if (p1.includes('.get') || p1.includes('.set') || p1.includes('._value')) {
                        stop();
                        this.#renderError(new Error('Do not attempt to directly access the value of a scoped item from an interpolated expression.\n\n' +
                            `${match}\n` +
                            `${' '.repeat(match.indexOf(p1))}${'^'.repeat(p1.length)}`));
                        return error('Do not attempt to directly access the value of a scoped item from an interpolated expression.\n\n', `${match}\n`, `${' '.repeat(match.indexOf(p1))}${'^'.repeat(p1.length)}`);
                    }
                    ret = String(wrappedEval(p1, {
                        [p1.split('.')[1].replace(/\?$/, '')]: undefined,
                    }, '$'));
                    if (this._lexicalScope[p1.split('.')[1].replace(/\?$/, '')])
                        return `<!-- etcher:is ${p1} -->${ret}<!-- etcher:ie -->`;
                    this._lexicalScope[p1.split('.')[1].replace(/\?$/, '')] = {
                        accessors: [
                            [
                                this,
                                (last, value) => {
                                    let index = this.shadowRoot.innerHTML.indexOf(`<!-- etcher:is ${p1} -->${last}<!-- etcher:ie -->`);
                                    while (index !== -1) {
                                        const element = parent(this.shadowRoot.innerHTML, index);
                                        const original = this.shadowRoot.querySelector(selector(map(this.shadowRoot.innerHTML), element));
                                        if (!original)
                                            return;
                                        replace(original, `<!-- etcher:is ${p1} -->${last}<!-- etcher:ie -->`, `<!-- etcher:is ${p1} -->${value}<!-- etcher:ie -->`);
                                        index = this.shadowRoot.innerHTML.indexOf(`<!-- etcher:is ${p1} -->${last}<!-- etcher:ie -->`, index + 1);
                                    }
                                },
                            ],
                        ],
                        _value: null,
                        get: null,
                        set: null,
                        subscribe: null,
                    };
                    return `<!-- etcher:is ${p1} -->${ret}<!-- etcher:ie -->`;
                }
                if (this.hasAttribute(expression)) {
                    let value = this.getAttribute(expression);
                    return `<!-- etcher:is ${p1} -->${value}<!-- etcher:ie -->`;
                }
                try {
                    const value = wrappedEval(p1);
                    return `<!-- etcher:is ${p1} -->${value}<!-- etcher:ie -->`;
                }
                catch (e) {
                    warn(`Could not execute interpolated expression: ${p1}`);
                    return `{{${p1}}}`;
                }
            });
            const atRules = parseExpression(component_body, /{@([a-zA-Z]*?) (.*)}/g);
            loopMatches(atRules, (rule) => {
                const [_match, type, expression] = rule;
                switch (type) {
                    case 'if': {
                        const expressionResult = wrappedEval(expression);
                        if (!expressionResult) {
                            const elseBlock = component_body.match(/{@if .*}.*{:else}(.*){\/if}/s);
                            if (elseBlock) {
                                component_body = component_body.replace(elseBlock[0], elseBlock[1]);
                            }
                            else {
                                component_body = component_body.replace(/{@if (.*)}(.*){\/if}/s, '');
                                return;
                            }
                        }
                        component_body = component_body.replace(/{@if (.*)}(.*){:else}(.*){\/if}/s, '$2');
                        break;
                    }
                    case 'for': {
                        const [_, value, iterable] = expression.match(/(.*) in (.*)/);
                        const iterableResult = wrappedEval(iterable);
                        let content = component_body.match(/{@for (.*?)}(.*){\/for}/s)[2];
                        let newContent = '';
                        for (const item of iterableResult) {
                            newContent += content.replace(new RegExp(`\{\{(.*?)\}\}`, 'g'), (_, p1) => {
                                const v = `((${value}) => (${p1}))(${JSON.stringify(item)})`;
                                return wrappedEval(v);
                            });
                        }
                        component_body = component_body.replace(/{@for (.*?)}(.*){\/for}/s, newContent);
                        break;
                    }
                    case 'state': {
                        const [_, name, value] = expression.match(/(.*)=(.*)/);
                        const varName = formatVariableName(name.trim());
                        this._lexicalScope[varName] = {
                            _value: wrappedEval(value.trim()),
                            accessors: [...(this._lexicalScope[varName]?.accessors || [])],
                            get() {
                                return this._value;
                            },
                            set(value) {
                                const prev = this._value;
                                this._value = value;
                                for (const accessor of this.accessors) {
                                    accessor[1](prev, value);
                                }
                            },
                            subscribe(callback) {
                                this.accessors.push([this, callback]);
                            },
                        };
                        component_body = component_body.replace(/{@state (.*?)}/s, '');
                        break;
                    }
                    case 'loop': {
                        const num = Number(expression);
                        let loopContent = component_body.match(/{@loop (.*?)}(.*){\/loop}/s)[2];
                        let newLoopContent = '';
                        for (let i = 0; i < num; i++) {
                            newLoopContent += loopContent.replace(new RegExp(`\{\{(.*?)\}\}`, 'g'), (_, p1) => {
                                const v = `((index) => (${p1}))(${i})`;
                                return wrappedEval(v);
                            });
                        }
                        component_body = component_body.replace(/{@loop (.*)}(.*){\/loop}/s, newLoopContent);
                        break;
                    }
                }
            });
            const eventAttrs = parseExpression(component_body, /<([a-zA-Z0-9-]+)([^<]*)@([a-zA-Z]*)=/gs);
            loopMatches(eventAttrs, (attr) => {
                const [_match, tagName, attrsBefore, event] = attr;
                const expression = parseBetweenPairs(component_body.indexOf(_match) + _match.length, ['{', '}'], component_body);
                const innerHTML = parseBetweenPairs(component_body.indexOf(_match) + _match.length + expression.length, ['>', '<'], component_body);
                component_body = component_body.replace(`${_match}${expression}`, `<${tagName}${attrsBefore}`);
                this._listeners[event] = [
                    ...(this._listeners[event] || []),
                    {
                        value: expression.replace(/^{/, '').replace(/}$/, ''),
                        tag: tagName,
                        content: innerHTML.replace(/>/, '').replace(/</, ''),
                    },
                ];
                window._$etcherCore.l[component_id] = this._listeners;
            });
            if (state === 'stopped')
                return;
            const parsed = html(component_body);
            const shadow = this.attachShadow({
                mode: 'open',
            });
            shadow.append(...parsed);
            state = 'mounted';
            for (let i = 0; i < Object.entries(this._lexicalScope).length; i++) {
                const [_, s] = Object.entries(this._lexicalScope)[i];
                for (let j = 0; j < s.accessors.length; j++) {
                    const [_, accessor] = s.accessors[j];
                    accessor(undefined, s.get());
                }
            }
            for (let i = 0; i < this._$etcherCoreInstance.scripts.length; i++) {
                const script = this._$etcherCoreInstance.scripts[i];
                script();
            }
            for (let i = 0; i < this.shadowRoot.styleSheets?.length; i++) {
                const style = this.shadowRoot.styleSheets[i];
                const node = style.ownerNode;
                if (node.hasAttribute('global')) {
                    const globalStyle = html(`<style etcher:global></style>`);
                    globalStyle[0].innerHTML = Array.from(style.cssRules)
                        ?.map?.((rule) => rule.cssText)
                        .join('\n');
                    document.head.append(...globalStyle);
                    node.remove();
                }
            }
            for (let i = 0; i < Object.entries(this._listeners).length; i++) {
                const [key, value] = Object.entries(this._listeners)[i];
                this.shadowRoot.addEventListener(key, (event) => {
                    for (let i = 0; i < value.length; i++) {
                        const listener = value[i];
                        const valid = event.target?.tagName?.toLowerCase?.() === listener.tag?.toLowerCase?.() &&
                            event.target?.innerHTML
                            ? event.target?.innerHTML.startsWith(listener.content)
                            : true;
                        if (valid) {
                            wrappedEval(listener.value, event, null, `const $ = {...window._$etcherCore.c['${component_id}']._lexicalScope};`);
                        }
                    }
                });
            }
        }
        catch (e) {
            stop();
            this.#renderError(e);
            error(e);
        }
    }
    #renderError(error) {
        const message = error.message.split('\n').join('<br />');
        const stack = error.stack
            .replace(`Error: ${error.message}`, '')
            .split('\n')
            .map((line) => `<div>${line}</div>`)
            .join('');
        const markup = `<div style="color: #ff4c4c; font-family: monospace; font-size: 14px; padding: 10px; background: #aaaaaa1c; border: 2px solid #e5e5e570; border-radius: 5px; margin: 10px 0; max-width: 900px;">
        <span style="white-space: break-spaces;">Error while rendering component: ${message}</span>
        <br />
        <br />
        <div style="font-size: 12px; color: #8a8989; font-family: monospace;">
            ${stack}
        </div>
        </div>`;
        if (this.shadowRoot) {
            this.shadowRoot.innerHTML = markup;
            return;
        }
        const shadow = this.attachShadow({
            mode: 'open',
        });
        shadow.append(...html(markup));
    }
};
const createElement = (component, name) => {
    return class extends EtcherElement {
        constructor() {
            super(component, name);
        }
    };
};

window._$etcherCore = {
    c: {},
    l: {},
};
const transform = (body, name) => {
    window.customElements.define(name, createElement(body, name));
};
window.etcher = {
    transform: transform,
    Element: EtcherElement,
};
Object.freeze(window.etcher);
var index = {
    transform: transform,
    Element: EtcherElement,
};

export { index as default };
