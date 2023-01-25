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
    if (arg && !namedArg) {
        return Function(`"use strict"\n${prepend || ''}\n;return (${expression})`)(arg);
    }
    if (arg && namedArg) {
        return new Function(namedArg, `"use strict"\n${prepend || ''}\n;return (${expression})`)(arg);
    }
    return Function(`"use strict";\n${prepend || ''}\nreturn (${expression})`)();
};
const startsWith = (str, regex, offset = 0) => {
    const rgx = new RegExp(`^.{${offset}}(${regex.source})`);
    const result = str.match(rgx);
    return !!result;
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
    const template = document.createElement('template');
    template.innerHTML = body;
    return template.content.children;
};
const replace = (element, find, replace) => {
    const html = element.innerHTML;
    const index = html.indexOf(find);
    if (index < 0)
        return;
    element.innerHTML =
        html.substring(0, index) +
            replace +
            html.substring(index + find.length);
    return element;
};
const closest = (body, stringIndex) => {
    const htmlCollection = html(body);
    if (htmlCollection.length < 0)
        return;
    let leftIndex = body.lastIndexOf('<', stringIndex);
    let rightIndex = body.indexOf('>', leftIndex);
    if (body[leftIndex + 1] === '!') {
        leftIndex = body.lastIndexOf('<', leftIndex - 1);
        rightIndex = body.indexOf('>', leftIndex);
    }
    const tag = body.substring(leftIndex + 1, rightIndex).split(' ')[0];
    for (let i = 0; i < htmlCollection.length; i++) {
        const element = htmlCollection[i];
        if (element.tagName.toLowerCase() !== tag.replace('/', ''))
            continue;
        if (!body.slice(0, leftIndex).endsWith(element.innerHTML) &&
            !body.slice(rightIndex + 1, -1).startsWith(element.innerHTML))
            continue;
        return element;
    }
    return null;
};
const selector = (element) => {
    let path = ``;
    while (element) {
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : ``;
        const classes = element.className
            ? `.${element.className
                .split(' ')
                .filter((c) => c)
                .join('.')}`
            : ``;
        const selector = `${tag}${id}${classes}`;
        if (element.parentElement &&
            element.parentElement?.children?.length !== 1) {
            const index = Array.from(element.parentElement.children).indexOf(element);
            path = path
                ? `${selector}:nth-child(${index + 1}) > ${path}`
                : `${selector}:nth-child(${index + 1})`;
        }
        else {
            path = path ? `${selector} > ${path}` : selector;
        }
        element = element.parentElement;
    }
    return path;
};

const error = (...message) => {
    console.error('%cetcher:%c', 'color: hsl(350, 89%, 72%); font-weight: 600', '', ...message);
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
                            if (value.startsWith('{') ||
                                value.startsWith('[')) {
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
                const p1 = parseBetweenPairs(0, ['{{', '}}'], match)
                    .replace(/^\{\{/, '')
                    .replace(/\}\}$/, '');
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
                    if (p1.includes('.get') ||
                        p1.includes('.set') ||
                        p1.includes('._value')) {
                        stop();
                        this.#renderError(new Error('Do not attempt to directly access the value of a scoped item from an interpolated expression.\n\n' +
                            `${match}\n` +
                            `${' '.repeat(match.indexOf(p1))}${'^'.repeat(p1.length)}`));
                        return error('Do not attempt to directly access the value of a scoped item from an interpolated expression.\n\n', `${match}\n`, `${' '.repeat(match.indexOf(p1))}${'^'.repeat(p1.length)}`);
                    }
                    ret = String(wrappedEval(p1, this._lexicalScope, '$'));
                    this._lexicalScope[p1.split('.')[1].replace(/\?$/, '')] = {
                        accessors: [
                            [
                                this,
                                (last, value) => {
                                    const element = closest(this.shadowRoot.innerHTML, this.shadowRoot.innerHTML.indexOf(`<!-- etcher:is ${p1} -->${last}<!-- etcher:ie -->`));
                                    const original = this.shadowRoot.querySelector(selector(element));
                                    if (!original)
                                        return;
                                    replace(original, `<!-- etcher:is ${p1} -->${last}<!-- etcher:ie -->`, `<!-- etcher:is ${p1} -->${value}<!-- etcher:ie -->`);
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
                return `<!-- etcher:is ${p1} -->{{${p1}}}<!-- etcher:ie -->`;
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
                            newContent += content.replaceAll(`{{${value}}}`, item);
                        }
                        component_body = component_body.replace(/{@for (.*?)}(.*){\/for}/s, newContent);
                        break;
                    }
                    case 'state': {
                        const [_, name, value] = expression.match(/(.*)=(.*)/);
                        const varName = formatVariableName(name.trim());
                        this._lexicalScope[varName] = {
                            _value: wrappedEval(value.trim()),
                            accessors: [
                                ...(this._lexicalScope[varName]?.accessors ||
                                    []),
                            ],
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
                        const num = parseInt(expression);
                        let loopContent = component_body.match(/{@loop (.*?)}(.*){\/loop}/s)[2];
                        let newLoopContent = '';
                        for (let i = 0; i < num; i++) {
                            newLoopContent += loopContent.replaceAll('{{index}}', i.toString());
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
                const innerHTML = parseBetweenPairs(component_body.indexOf(_match) +
                    _match.length +
                    expression.length, ['>', '<'], component_body);
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
                        const valid = event.target?.tagName?.toLowerCase?.() ===
                            listener.tag?.toLowerCase?.() &&
                            event.target?.innerHTML.startsWith(listener.content);
                        if (valid) {
                            if (startsWith(listener.value, /\(.*\)\s*=>/)) {
                                wrappedEval('(' + listener.value + ')()', event, null, `const $ = {...window._$etcherCore.c['${component_id}']._lexicalScope};`);
                            }
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
        const shadow = this.attachShadow({
            mode: 'open',
        });
        shadow.append(...html(`<div style="color: #ff4c4c; font-family: monospace; font-size: 14px; padding: 10px; background: #aaaaaa1c; border: 2px solid #e5e5e570; border-radius: 5px; margin: 10px 0; max-width: 900px;">
        <span style="white-space: break-spaces;">Error while rendering component: ${message}</span>
        <br />
        <br />
        <div style="font-size: 12px; color: #8a8989; font-family: monospace;">
            ${stack}
        </div>
        </div>`));
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
