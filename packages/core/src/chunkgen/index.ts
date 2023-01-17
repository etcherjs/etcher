import type { Chunk } from '../types';

import { runHooks } from '../config/plugins';
import { HOOK_TYPES } from '../constants';
import crypto from 'crypto';
import chalk from 'chalk';

const initialValue = `
window._$etcherCore = {
    c: {},
    l: {},
}
var wrappedEval = (expression, arg, namedArg) => {
    if (arg && !namedArg) {
        return Function(\`"use strict";return (\${expression})\`)(arg);
    }
    if (arg && namedArg) {
        return new Function(namedArg, \`"use strict";return (\${expression})\`)(arg);
    }
    return Function(\`"use strict";return (\${expression})\`)();
}
var startsWith = (str, regex, offset = 0) => {
    const rgx = new RegExp(\`^.{\${offset}}(\${regex.source})\`);
    const result = str.match(rgx);
    return !!result;
}
var parseJSON = (obj) => {
    obj = obj.replace(/,\\s*(?=})/, '');
    obj = obj.replace(/'/g, '"');
    obj = obj.replace(/([a-zA-Z0-9_]+):/g, '"$1":');

    return JSON.parse(obj);
};
var parseExpression = (doc, rgx) => {
    const res = [];

    let match = rgx.exec(doc);

    while (match != null) {
        res.push(match);
    
        match = rgx.exec(doc);
    };

    return res;
};
var transform = (doc, name) => {
    class etcherElement extends HTMLElement {
        _listeners = {};
        _states = {};
        constructor() {
            super();

            window._$etcherCore.c[name] = this;

            const scripts = doc.match(/<script>(.*?)<\\/script>/gs);

            if (scripts) {
                for (let i = 0; i < scripts.length; i++) {
                    const script = scripts[i];
                    
                    const scriptContent = script.replace(/<script>|<\\/script>/g, '');

                    const interpolated = scriptContent.replace(/\\$([a-zA-Z0-9_]+)/g, (match, p1) => {
                        if (this.hasAttribute("#" + p1.trim())) {
                            let value = this.getAttribute("#" + p1.trim());

                            value = value.replaceAll('&quot;', '"');
                            value = value.replaceAll('&apos;', "'");
                            value = value.replaceAll('&lt;', '<');
                            value = value.replaceAll('&gt;', '>');
                            value = value.replaceAll('&amp;', '&');
                            value = value.replaceAll('&grave;', '\`');

                            if (value.startsWith('{') || value.startsWith('[')) {
                                try {
                                    value = JSON.parse(value);
                                } catch (e) {
                                    try {
                                        value = parseJSON(value);
                                    } catch (e) {
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

                    const func = wrappedEval("(async () => { " + interpolated + " })");

                    this._$etcherCoreInstance.scripts.push(func);

                    func();
                }
            }

            doc = doc.replaceAll(/\{\{(.*)\}\}/g, (match, p1) => {
                const expression = p1.split('.')[0].trim();

                if (this.hasAttribute("#" + expression)) {
                    let value = this.getAttribute("#" + expression);

                    value = value.replaceAll('&quot;', '"');
                    value = value.replaceAll('&apos;', "'");
                    value = value.replaceAll('&lt;', '<');
                    value = value.replaceAll('&gt;', '>');
                    value = value.replaceAll('&amp;', '&');
                    value = value.replaceAll('&grave;', '\`');

                    if (value.startsWith('{') || value.startsWith('[')) {
                        try {
                            value = JSON.parse(value);
                        } catch (e) {
                            try {
                                value = parseJSON(value);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }

                    if (p1.split(".").length > 1) {
                        return wrappedEval(p1, value, p1.split(".")[0]);
                    }

                    value = wrappedEval(value);

                    return value;
                }

                if (this.hasAttribute(expression)) {
                    let value = this.getAttribute(expression);

                    return value;
                }

                return \`{{\${p1}}}\`;
            });

            const atRules = parseExpression(doc, /{@([a-zA-Z]*) (.*)}/g);
            
            for (let i = 0; i < atRules.length; i++) {
                const rule = atRules[i];
                
                const [_, type, expression] = rule;

                switch (type) {
                    case "if":
                        const expressionResult = wrappedEval(expression);

                        if (!expressionResult) {
                            const elseBlock = doc.match(/{@if .*}.*{:else}(.*){\\/if}/s);

                            if (elseBlock) {
                                doc = doc.replace(elseBlock[0], elseBlock[1]);
                            } else {
                                doc = doc.replace(/{@if (.*)}(.*){\\/if}/s, '');

                                return;
                            }
                        }

                        doc = doc.replace(/{@if (.*)}(.*){:else}(.*){\\/if}/s, '$2');
                        break;
                    case "for":
                        const [_, value, iterable] = expression.match(/(.*) in (.*)/);

                        const iterableResult = wrappedEval(iterable);

                        let content = doc.match(/{@for (.*?)}(.*){\\/for}/s)[2];


                        let newContent = '';

                        for (const item of iterableResult) {
                            newContent += content.replaceAll(\`{{\${value}}}\`, item);
                        }
                        
                        doc = doc.replace(/{@for (.*?)}(.*){\\/for}/s, newContent);

                        break;
                    case "loop":
                        const num = parseInt(expression);

                        let loopContent = doc.match(/{@loop (.*?)}(.*){\\/loop}/s)[2];

                        let newLoopContent = '';

                        for (let i = 0; i < num; i++) {
                            newLoopContent += loopContent.replaceAll('{{index}}', i.toString());
                        }

                        doc = doc.replace(/{@loop (.*)}(.*){\\/loop}/s, newLoopContent);

                        break;
                }
            }

            const eventAttrs = parseExpression(doc, /@([a-zA-Z]*)={(.*)}/g);

            for (let i = 0; i < eventAttrs.length; i++) {
                const attr = eventAttrs[i];

                const [_, event, expression] = attr;

                doc = doc.replace(attr[0], '');

                let tagStart = doc.lastIndexOf('<', attr.index);
                let tagEnd = doc.indexOf('>', attr.index);

                const tagContent = doc.substring(tagStart + 1, tagEnd);
                const tagName = tagContent.split(' ')[0];

                const innerHTML = doc.substring(tagEnd + 1, doc.indexOf('</' + tagName + '>', tagEnd));

                this._listeners[event] = [
                    ...this._listeners[event] || [],
                    {
                        value: expression,
                        tag: tagName,
                        content: innerHTML
                    }
                ]

                window._$etcherCore.l[name] = this._listeners;
            }

            const parsed = new DOMParser().parseFromString(doc, "text/html");

            const shadow = this.attachShadow({
                mode: "open"
            });

            shadow.append(...parsed.body.children)

            for (let i = 0; i < this.shadowRoot.styleSheets?.length; i++)  {
                const style = this.shadowRoot.styleSheets[i];

                if (style.ownerNode.hasAttribute('global')) {
                    const globalStyle = document.createElement('style');

                    globalStyle.setAttribute('etcher:global', 'true');

                    globalStyle.innerHTML = Array.from(style.cssRules)?.map?.(rule => rule.cssText).join('\\n');

                    document.head.append(globalStyle);
                    style.ownerNode.remove();
                }
            }

            for (let i = 0; i < Object.entries(this._listeners).length; i++) {
                const [key, value] = Object.entries(this._listeners)[i];

                this.shadowRoot.addEventListener(key, (e) => {
                    for (let i = 0; i < value.length; i++) {
                        const listener = value[i];
                        
                        const valid = e.target?.tagName?.toLowerCase?.() === listener.tag?.toLowerCase?.() && e.target?.innerHTML === listener.content;

                        if (valid) {
                            if (startsWith(listener.value, /\\(.*\\)\\s*=>/)) {
                                const val = listener.value.replace(/\\(.*\\)\\s*=>\\s*{(\\n*.*\\n*)*}/, (match, p1) => {
                                    return p1;
                                })

                                wrappedEval(val, e);
                            }

                            wrappedEval(listener.value, e);
                        };
                    }
                })
            }
        }
        _$etcherCoreInstance = {
            name: name,
            content: doc,
            instance: this,
            scripts: [],
        };
    }
    window.customElements.define(name, etcherElement)
};
window.etcher = {
    transform: transform,
};
Object.freeze(window.etcher);`;

export let chunks = initialValue;

export const CHUNK_REGISTRY: Chunk[] = [];

let id = 0;

const escape = (str: string) => {
    return str.replace(/`/g, '\\`').replace(/\${/g, '\\${');
};

export const processChunk = async (name: string, data: string) => {
    try {
        id++;

        const suffix = crypto.randomBytes(4).toString('hex');
        const chunkName = `etcher-${suffix}`;

        const chunk: Chunk = {
            id,
            name,
            chunkName,
            data: `${data}`,
        };

        const PluginHookResult = await runHooks({
            hook: HOOK_TYPES.PROCESS_CHUNK,
            args: [chunk],
        });

        if (PluginHookResult?.data) {
            PluginHookResult.data = escape(PluginHookResult.data);
        } else {
            chunk.data = escape(chunk.data);
        }

        chunks += `transform(\`${PluginHookResult?.data || chunk.data}\`, '${
            PluginHookResult?.chunkName || chunk.chunkName
        }');`;

        CHUNK_REGISTRY.push(PluginHookResult || chunk);

        runHooks({
            hook: HOOK_TYPES.GENERATED_CHUNK,
            args: [PluginHookResult || chunk],
        });
    } catch (e) {
        console.error(chalk.red(`Error generating chunk: ${e}`));
    }
};

export const parseFile = (file: string) => {
    try {
        let fileData = file;

        for (const chunk of CHUNK_REGISTRY) {
            fileData = fileData.replaceAll(
                `etcher-${chunk.name}`,
                chunk.chunkName
            );
        }

        return fileData;
    } catch (e) {
        console.error(chalk.red(`Error parsing file: ${e}`));
    }
};

export const done = (expectedLength: number) => {
    return CHUNK_REGISTRY.length === expectedLength;
};

export const resetChunks = () => {
    chunks = initialValue;
    CHUNK_REGISTRY.length = 0;
};
