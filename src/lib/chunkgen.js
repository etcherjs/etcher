import crypto from 'crypto';
import chalk from 'chalk';

const initialValue = `const transformComponent = (doc , name) => {
    class customElement extends HTMLElement {
        constructor() {
            super();

            doc = doc.replaceAll(/\{\{(.*)\}\}/g, (match, p1) => {
                return this.getAttribute(p1) || '';
            })

            const parsed = new DOMParser().parseFromString(doc, "text/html");

            const shadow = this.attachShadow({
                mode: "open"
            });

            shadow.append(...parsed.body.children)
        }
    }
    window.customElements.define(name, customElement)
};`;

export let chunks = initialValue;

export const CHUNK_REGISTRY = [];

let id = 0;

export const generateChunk = (name, data) => {
    try {
        id++;
        const suffix = crypto.randomBytes(4).toString('hex');
        const chunkName = `etcher-${suffix}`;

        const escapedData = data.replace(/`/g, '\\`');

        CHUNK_REGISTRY.push({
            id,
            name,
            chunkName,
            data: `transformComponent(\`${escapedData}\`, '${chunkName}');`,
        });

        chunks += CHUNK_REGISTRY.find((chunk) => chunk.id === id)?.data;
    } catch (e) {
        console.error(chalk.red(`Error generating chunk: ${e}`));
    }
};

// find all usages of chunk names in an html file and replace them with the actual chunkName
export const parseFile = (file) => {
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

export const done = (expectedLength) => {
    return CHUNK_REGISTRY.length === expectedLength;
};

export const resetChunks = () => {
    chunks = initialValue;
    CHUNK_REGISTRY.length = 0;
};
