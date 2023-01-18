window._$etcherCore = {
    c: {},
    l: {},
};
const formatVariableName = (name) => {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
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
    obj = obj.replace(/,\s*(?=})/, '');
    obj = obj.replace(/'/g, '"');
    obj = obj.replace(/([a-zA-Z0-9_]+):/g, '"$1":');
    return JSON.parse(obj);
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
    return doc.substring(start, end + 1);
};
const transform = (doc, name) => {
    class etcherElement extends HTMLElement {
        _listeners = {};
        _lexicalScope = {};
        constructor() {
            super();
            window._$etcherCore.c[name] = this;
            const scripts = doc.match(/<script>(.*?)<\/script>/gs);
            if (scripts) {
                for (let i = 0; i < scripts.length; i++) {
                    const script = scripts[i];
                    let scriptContent = `const $ = {
                        ...window._$etcherCore.c['${name}']._lexicalScope,
                    };${script.replace(/<script>|<\/script>/g, '')}`;
                    const interpolated = scriptContent.replace(/$([a-zA-Z0-9_]+)/g, (match, p1) => {
                        if (this.hasAttribute('#' + p1.trim())) {
                            let value = this.getAttribute('#' + p1.trim());
                            value = value.replaceAll('&quot;', '"');
                            value = value.replaceAll('&apos;', "'");
                            value = value.replaceAll('&lt;', '<');
                            value = value.replaceAll('&gt;', '>');
                            value = value.replaceAll('&amp;', '&');
                            value = value.replaceAll('&grave;', '`');
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
                                        console.error(e);
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
            doc = doc.replaceAll(/\{\{(.*)\}\}/g, (match, p1) => {
                const expression = p1.split('.')[0].trim();
                if (this.hasAttribute('#' + expression)) {
                    let value = this.getAttribute('#' + expression);
                    value = value.replaceAll('&quot;', '"');
                    value = value.replaceAll('&apos;', "'");
                    value = value.replaceAll('&lt;', '<');
                    value = value.replaceAll('&gt;', '>');
                    value = value.replaceAll('&amp;', '&');
                    value = value.replaceAll('&grave;', '`');
                    if (value.startsWith('{') || value.startsWith('[')) {
                        try {
                            value = JSON.parse(value);
                        }
                        catch (e) {
                            try {
                                value = parseJSON(value);
                            }
                            catch (e) {
                                console.error(e);
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
                    let ret = String(wrappedEval(p1, this._lexicalScope, '$'));
                    this._lexicalScope[p1.split('.')[1].replace(/\?$/, '')] = {
                        accessors: [
                            [
                                this,
                                (_, value) => {
                                    this.shadowRoot.innerHTML =
                                        this.shadowRoot.innerHTML.replace(new RegExp(`<!-- etcher:is ${p1.replace(/([^a-zA-Z0-9])/g, '\\$1')} -->.*?<!-- etcher:ie -->`, 'gs'), `<!-- etcher:is ${p1} -->${value}<!-- etcher:ie -->`);
                                },
                            ],
                        ],
                        _value: null,
                        get: null,
                        set: null,
                    };
                    return `<!-- etcher:is ${p1} -->${ret}<!-- etcher:ie -->`;
                }
                if (this.hasAttribute(expression)) {
                    let value = this.getAttribute(expression);
                    return `<!-- etcher:is ${p1} -->${value}<!-- etcher:ie -->`;
                }
                return `<!-- etcher:is ${p1} -->{{${p1}}}<!-- etcher:ie -->`;
            });
            const atRules = parseExpression(doc, /{@([a-zA-Z]*) (.*)}/g);
            for (let i = 0; i < atRules.length; i++) {
                const rule = atRules[i];
                const [_match, type, expression] = rule;
                switch (type) {
                    case 'if': {
                        const expressionResult = wrappedEval(expression);
                        if (!expressionResult) {
                            const elseBlock = doc.match(/{@if .*}.*{:else}(.*){\/if}/s);
                            if (elseBlock) {
                                doc = doc.replace(elseBlock[0], elseBlock[1]);
                            }
                            else {
                                doc = doc.replace(/{@if (.*)}(.*){\/if}/s, '');
                                return;
                            }
                        }
                        doc = doc.replace(/{@if (.*)}(.*){:else}(.*){\/if}/s, '$2');
                        break;
                    }
                    case 'for': {
                        const [_, value, iterable] = expression.match(/(.*) in (.*)/);
                        const iterableResult = wrappedEval(iterable);
                        let content = doc.match(/{@for (.*?)}(.*){\/for}/s)[2];
                        let newContent = '';
                        for (const item of iterableResult) {
                            newContent += content.replaceAll(`{{${value}}}`, item);
                        }
                        doc = doc.replace(/{@for (.*?)}(.*){\/for}/s, newContent);
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
                        };
                        doc = doc.replace(/{@state (.*?)}/s, '');
                        break;
                    }
                    case 'loop': {
                        const num = parseInt(expression);
                        let loopContent = doc.match(/{@loop (.*?)}(.*){\/loop}/s)[2];
                        let newLoopContent = '';
                        for (let i = 0; i < num; i++) {
                            newLoopContent += loopContent.replaceAll('{{index}}', i.toString());
                        }
                        doc = doc.replace(/{@loop (.*)}(.*){\/loop}/s, newLoopContent);
                        break;
                    }
                }
            }
            const eventAttrs = parseExpression(doc, /<([a-zA-Z0-9-]+)([^<]*)@([a-zA-Z]*)=/gs);
            for (let i = 0; i < eventAttrs.length; i++) {
                const attr = eventAttrs[i];
                const [match, tagName, attrsBefore, event] = attr;
                const expression = parseBetweenPairs(doc.indexOf(match) + match.length, ['{', '}'], doc);
                const innerHTML = parseBetweenPairs(doc.indexOf(match) + match.length + expression.length, ['>', '<'], doc);
                doc = doc.replace(`${match}${expression}`, `<${tagName}${attrsBefore}`);
                this._listeners[event] = [
                    ...(this._listeners[event] || []),
                    {
                        value: expression.replace(/^{/, '').replace(/}$/, ''),
                        tag: tagName,
                        content: innerHTML.replace(/>/, '').replace(/</, ''),
                    },
                ];
                window._$etcherCore.l[name] = this._listeners;
            }
            const parsed = new DOMParser().parseFromString(doc, 'text/html');
            const shadow = this.attachShadow({
                mode: 'open',
            });
            shadow.append(...parsed.body.children);
            for (let i = 0; i < Object.entries(this._lexicalScope).length; i++) {
                const [_, s] = Object.entries(this._lexicalScope)[i];
                for (let j = 0; j < s.accessors.length; j++) {
                    const [_, accessor] = s.accessors[j];
                    accessor(s.get(), s.get());
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
                    const globalStyle = document.createElement('style');
                    globalStyle.setAttribute('etcher:global', 'true');
                    globalStyle.innerHTML = Array.from(style.cssRules)
                        ?.map?.((rule) => rule.cssText)
                        .join('\n');
                    document.head.append(globalStyle);
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
                                wrappedEval('(' + listener.value + ')()', event, null, `const $ = {...window._$etcherCore.c['${name}']._lexicalScope};`);
                            }
                            wrappedEval(listener.value, event, null, `const $ = {...window._$etcherCore.c['${name}']._lexicalScope};`);
                        }
                    }
                });
            }
        }
        _$etcherCoreInstance = {
            name: name,
            content: doc,
            instance: this,
            scripts: [],
        };
    }
    window.customElements.define(name, etcherElement);
};
window.etcher = {
    transform: transform,
};
Object.freeze(window.etcher);
