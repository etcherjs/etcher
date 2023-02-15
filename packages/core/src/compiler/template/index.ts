import { parse, stringify } from 'html-parse-string';

import {
    Node,
    create,
    createComment,
    createConditional,
    createForLoop,
    createIndexLoop,
    createRoot,
    createText,
    createInterpolation,
} from './types.js';

import crypto from 'crypto';

const VOID_TAGS = ['If', 'For', 'Loop'];

const valueBetweenPairs = (str: string, start: string, end: string): string => {
    let startIndex = str.indexOf(start);

    if (startIndex === -1) {
        return null;
    }

    let endIndex = str.indexOf(end, startIndex + start.length);

    if (endIndex === -1) {
        return null;
    }

    let nestedStartIndex = str.indexOf(start, startIndex + start.length);

    while (nestedStartIndex !== -1 && nestedStartIndex < endIndex) {
        endIndex = str.indexOf(end, endIndex + end.length);

        if (endIndex === -1) {
            return null;
        }

        nestedStartIndex = str.indexOf(start, nestedStartIndex + start.length);
    }

    return str.substring(startIndex + start.length, endIndex);
};

const testForInterpolation = (str: string): boolean => {
    const startIndex = str.indexOf('{{');
    const endIndex = str.indexOf('}}');

    if (startIndex === -1 || endIndex === -1) {
        return false;
    }

    return true;
};

const transformVoid = (template: string): string => {
    const scriptTags = template.match(/<script.*?>([\s\S]*?)<\/script>/g);
    const eventAttributes = template.match(/@[\w-]+=\{((?:[\s\S])*)}/g);
    const computedAttributes = template.match(/#[\w-]+=\{((?:[\s\S])*)}/g);

    const processEntities = (str: string, whitespace = false): string => {
        return whitespace
            ? str
                  .replaceAll('&', '&amp;')
                  .replaceAll(' ', '&wsp;')
                  .replaceAll('\n', '&nlwsp;')
                  .replaceAll('<', '&lt;')
                  .replaceAll('>', '&gt;')
                  .replaceAll('"', '&quot;')
                  .replaceAll("'", '&apos;')
                  .replaceAll('`', '&grave;')
            : str
                  .replaceAll('&', '&amp;')
                  .replaceAll('<', '&lt;')
                  .replaceAll('>', '&gt;')
                  .replaceAll('"', '&quot;')
                  .replaceAll("'", '&apos;')
                  .replaceAll('`', '&grave;');
    };

    for (let i = 0; i < scriptTags?.length; i++) {
        const scriptTag = scriptTags[i];

        const content = valueBetweenPairs(scriptTag, '<script>', '</script>');

        template = template.replace(content, processEntities(content));
    }

    for (let i = 0; i < eventAttributes?.length; i++) {
        const eventAttribute = eventAttributes[i];

        const content = valueBetweenPairs(eventAttribute, '{', '}');

        template = template.replace(content, processEntities(content, true));
    }

    for (let i = 0; i < computedAttributes?.length; i++) {
        const computedAttribute = computedAttributes[i];

        const content = valueBetweenPairs(computedAttribute, '{', '}');

        template = template.replace(content, processEntities(content, true));
    }

    return template;
};

export const reverseTransformVoid = (template: string, whole = false): string => {
    const scriptTags = template.match(/<script.*?>([\s\S]*?)<\/script>/g);
    const eventAttributes = template.match(/@[\w-]+=\{([\s\S]*)}/g);
    const computedAttributes = template.match(/#[\w-]+=\{([\s\S]*)}/g);

    const processEntities = (str: string): string => {
        return str
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&amp;', '&')
            .replaceAll('&quot;', '"')
            .replaceAll('&apos;', "'")
            .replaceAll('&grave;', '`')
            .replaceAll('&wsp;', ' ')
            .replaceAll('&nlwsp;', '\n');
    };

    if (whole) {
        return processEntities(template);
    }

    for (let i = 0; i < scriptTags?.length; i++) {
        const scriptTag = scriptTags[i];

        const content = valueBetweenPairs(scriptTag, '<script>', '</script>');

        template = template.replace(content, processEntities(content));
    }

    for (let i = 0; i < eventAttributes?.length; i++) {
        const eventAttribute = eventAttributes[i];

        const content = valueBetweenPairs(eventAttribute, '{', '}');

        template = template.replace(content, processEntities(content));
    }

    for (let i = 0; i < computedAttributes?.length; i++) {
        const computedAttribute = computedAttributes[i];

        const content = valueBetweenPairs(computedAttribute, '{', '}');

        template = template.replace(content, processEntities(content));
    }

    return template;
};

export const parseHTMLTemplate = (template: string): Node[] => {
    const AST = parse(transformVoid(template));
    let oAST = [];

    for (let i = 0; i < AST.length; i++) {
        const node = AST[i];

        switch (node.type) {
            case 'text': {
                const isInterpolation = testForInterpolation(node.content);

                if (isInterpolation) {
                    const content = valueBetweenPairs(node.content, '{{', '}}');

                    oAST.push(
                        createText(node.content.substring(0, node.content.indexOf('{{'))),
                        createInterpolation(content),
                        createText(node.content.substring(node.content.indexOf('}}') + 2))
                    );
                    break;
                }

                oAST.push(createText(node.content));
                break;
            }
            case 'comment': {
                oAST.push(createComment(node.content));
                break;
            }
            case 'tag': {
                const { name, attrs, children } = node;

                let childNodes: Node[] = [];
                let attributes: {
                    [key: string]: {
                        key: string;
                        value: string;
                        inline: boolean;
                        isComputed: boolean;
                        isEventHandler: boolean;
                    };
                } = {};

                for (let j = 0; j < children.length; j++) {
                    const child = children[j];

                    switch (child.type) {
                        case 'text': {
                            const isInterpolation = testForInterpolation(child.content);

                            if (isInterpolation) {
                                const content = valueBetweenPairs(child.content, '{{', '}}');

                                childNodes.push(
                                    createText(child.content.substring(0, child.content.indexOf('{{'))),
                                    createInterpolation(content),
                                    createText(child.content.substring(child.content.indexOf('}}') + 2))
                                );
                                break;
                            }

                            childNodes.push(createText(child.content));
                            break;
                        }
                        case 'comment': {
                            childNodes.push(createComment(child.content));
                            break;
                        }
                        case 'tag': {
                            childNodes.push(parseHTMLTemplate(stringify([child]))[0]);
                            break;
                        }
                    }
                }

                for (let j = 0; j < Object.keys(attrs).length; j++) {
                    const attr = Object.entries(attrs)[j];

                    attributes[attr[0]] = {
                        key: attr[0].replace(/^[@#]/, ''),
                        value: attr[1].replace(/^"|"$|^{|}$/g, ''),
                        inline: attr[1].startsWith('"') && attr[1].endsWith('"'),
                        isComputed: (attr[1].startsWith('{') && attr[1].endsWith('}')) || attr[0].startsWith('#'),
                        isEventHandler: attr[0].startsWith('@'),
                    };
                }

                oAST.push(create(stringify([node]), name, attributes, false, ...childNodes));
            }
        }
    }

    return oAST;
};

export const htmlFrom = (ast: Node[]): string => {
    let html = '';

    for (let i = 0; i < ast.length; i++) {
        const node = ast[i];

        if (!node) continue;

        switch (node.type) {
            case 'Text': {
                html += node.data;
                break;
            }
            case 'Interpolation': {
                html += `<!>`;
                break;
            }
            case 'Comment': {
                html += `<!--${node.data}-->`;
                break;
            }
            case 'Element': {
                let { tag, attributes, raw, children } = node;

                if (VOID_TAGS.includes(tag)) {
                    tag = `etcher-std-${tag}`;
                }

                html += `<${tag}`;

                for (let j = 0; j < Object.keys(attributes).length; j++) {
                    const attr = attributes[Object.keys(attributes)[j]];

                    if (attr.isEventHandler) continue;
                    if (attr.isComputed) {
                        html += ` ${attr.key}="${JSON.stringify(reverseTransformVoid(attr.value, true))
                            .replaceAll('"', "'")
                            .replace(/^'|'$/g, '')}"`;
                        continue;
                    }

                    html += ` ${attr.key}="${attr.value}"`;
                }

                html += `>${htmlFrom(children)}</${tag}>`;

                break;
            }
            case 'Conditional': {
                html += `<!--${node.condition}-->`;
                break;
            }
            case 'Each': {
                html += `<!--${node.expression}-->`;
                break;
            }
            case 'EachIndex': {
                html += `<!--${node.expression}-->`;
                break;
            }
        }
    }

    return reverseTransformVoid(html);
};