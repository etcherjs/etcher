import crypto from 'crypto';
import chalk from 'chalk';

const initialValue = `
var wrappedEval = (expression, arg) => {
        if (arg) {
            const fn = Function(\`"use strict";return (\${expression})\`)

        return fn(arg);
    }
    return Function(\`"use strict";return (\${expression})\`)();
}
var startsWith = (str, regex, offset = 0) => {
    const rgx = new RegExp(\`^.{\${offset}}(\${regex.source})\`);
    const result = str.match(rgx);
    return !!result;
}
var parseJSON = (obj) => {
    obj = obj.replace(/,\\s*$/, '');
    obj = obj.replace(/'/g, '"');
    obj = obj.replace(/"([^"]+)":/g, '$1:');

    return JSON.parse(obj);
};
var parseAt = (doc) => {
    const rules = [];

    const ruleRgx = /{@([a-zA-Z]*) (.*)}/g

    let match = ruleRgx.exec(doc);

    while (match != null) {
        rules.push({
            type: match[1],
            value: match[2],
            match: match
        });
    
        match = ruleRgx.exec(doc);
    };

    return rules.reverse();
};
var parseEvents = (doc) => {
    const rules = [];

    const ruleRgx = /@([a-zA-Z]*)={(.*)}/g;

    let match = ruleRgx.exec(doc);

    while (match != null) {
        rules.push({
            type: match[1],
            value: match[2],
            match: match
        });

        match = ruleRgx.exec(doc);
    };

    return rules;
}
var transform = (doc, name) => {
    class etcherElement extends HTMLElement {
        _listeners = {};
        _states = {};
        constructor() {
            super();

            doc = doc.replaceAll(/\{\{(.*)\}\}/g, (match, p1) => {
                const attr = this.getAttribute(p1) || '';

                if (attr.startsWith('{') || attr.startsWith('[')) {
                    return parseJSON(attr);
                }

                return attr;
            });

            const atRules = parseAt(doc);

            for (let i = 0; i < atRules.length; i++) {
                const rule = atRules[i];
                
                const ruleContent = doc.substring(rule.match.index + rule.match[0].length, doc.indexOf('{@end}', rule.match.index));

                switch (rule.type) {
                    case 'loop':
                        const loopCount = Number(rule.value);

                        doc = doc.replace(rule.match[0] + ruleContent + '{@end}', ruleContent.repeat(loopCount));

                        break;
                    case 'if':
                        const ifCondition = rule.value;

                        const conditionResult = wrappedEval(ifCondition);

                        if (!conditionResult) {
                            doc = doc.replace(rule.match[0] + ruleContent + '{@end}', '');
                        } else {
                            doc = doc.replace(rule.match[0] + ruleContent + '{@end}', ruleContent);
                        }

                        break;
                    case 'state':
                        const stateName = rule.value.split(' ')[0];
                        let stateValue = rule.value.split('=')[1];

                        if (!stateValue) {  
                            stateValue = this.getAttribute(stateName) || null;
                        }

                        if (stateValue.startsWith('{') || stateValue.startsWith('[')) {
                            stateValue = parseJSON(stateValue);
                        }

                        this._states[stateName] = stateValue;

                        break;
                    default:
                        break;
                }
            }

            const events = parseEvents(doc);

            for (let i = 0; i < events.length; i++) {
                const attr = events[i];

                const attrContent = attr.match[0];

                doc = doc.replace(attrContent, '');

                const eventIndex = attr.match.index;

                let tagStart = doc.lastIndexOf('<', eventIndex);
                let tagEnd = doc.indexOf('>', eventIndex);

                const tag = doc.substring(tagStart, tagEnd + 1);
                const tagContent = doc.substring(tagStart + 1, tagEnd);
                const tagName = tagContent.split(' ')[0];

                const innerHTML = doc.substring(tagEnd + 1, doc.indexOf('</' + tagName + '>', tagEnd));

                this._listeners[attr.type] = [
                    ...this._listeners[attr.type] || [],
                    {
                        value: attr.value,
                        match: attr.match,
                        tag: tagName,
                        content: innerHTML
                    }
                ]
            }

            const parsed = new DOMParser().parseFromString(doc, "text/html");

            const shadow = this.attachShadow({
                mode: "open"
            });

            shadow.append(...parsed.body.children)

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
                });
            }
        }
        _etcherInstance = {
            name: name,
            content: doc,
            instance: this
        };
    }
    window.customElements.define(name, etcherElement)
};`;

export let chunks = initialValue;

export const CHUNK_REGISTRY = [];

let id = 0;

export const generateChunk = (name: string, data: string) => {
    try {
        id++;
        const suffix = crypto.randomBytes(4).toString('hex');
        const chunkName = `etcher-${suffix}`;

        const escapedData = data.replace(/`/g, '\\`');

        CHUNK_REGISTRY.push({
            id,
            name,
            chunkName,
            data: `transform(\`${escapedData}\`, '${chunkName}');`,
        });

        chunks += CHUNK_REGISTRY.find((chunk) => chunk.id === id)?.data;
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
