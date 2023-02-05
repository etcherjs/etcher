import {
    CompletionItem,
    CompletionItemKind,
    CompletionParams,
    InsertTextFormat,
    MarkupKind,
    TextDocuments,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Settings, VALID_HTML_TAGS } from '../constants';
import { retrieveConfig } from '../config';

import * as path from 'path';
import * as fs from 'fs';

export const endEndsWith = (text: string, compare: string) => {
    return text.includes(compare) || compare.includes(text);
};

export const isInsideTag = (line: string, position: number) => {
    const before = line.substring(0, position);
    const after = line.substring(position);

    const beforeTag = before.includes('<');
    const afterTag = after.includes('>');

    return beforeTag && afterTag;
};

export const CompletionHandler = (
    settings: Settings,
    documents: TextDocuments<TextDocument>,
    params: CompletionParams
) => {
    const config = retrieveConfig(params.textDocument.uri);

    const components = fs.readdirSync(config.componentsDir).map((component) => ({
        name: component.replace('.xtml', '').trim(),
        path: path.join(config.componentsDir, component),
    }));

    const text = documents.get(params.textDocument.uri)?.getText();

    if (!text) return [];

    const line = text.split('\n')[params.position.line];
    const around = line.substring(params.position.character - 30).trim();

    const completionItems: CompletionItem[] = [];

    components.forEach((component) => {
        if (endEndsWith(component.name, around) || around.includes('etcher-') || 'etcher-'.includes(around)) {
            completionItems.push({
                label:
                    around.includes('etcher-') || 'etcher-'.startsWith(around)
                        ? `etcher-${component.name}`
                        : component.name,
                kind: CompletionItemKind.Property,
                insertText: `<etcher-${component.name}>\n\t$0\n</etcher-${component.name}>`,
                insertTextFormat: InsertTextFormat.Snippet,
                detail: 'Etcher Component',
                documentation: {
                    kind: MarkupKind.Markdown,
                    value: `**Etcher Component**\n\nInserts an etcher component with the specified name. [Go to definition.](file://${component.path})\n\n\`\`\`html\n<etcher-${component.name}>\n\t...\n</etcher-${component.name}>\n\`\`\``,
                },
            });
        }
    });

    if (around.includes('@') && isInsideTag(line, params.position.character)) {
        const event = around.split('@')[1].split(' ')[0].split('=')[0].split('>')[0];

        completionItems.push({
            label: `on:${event}`,
            kind: CompletionItemKind.Event,
            insertText: `${event}$0={(event) => {\n\t$1\n}}`,
            insertTextFormat: InsertTextFormat.Snippet,
            detail: 'Etcher Event Listener',
            documentation: {
                kind: MarkupKind.Markdown,
                value: `**Etcher Event Listener**\n\nAttaches an event listener to the element.`,
            },
        });
    }

    if (settings.emmet) {
        VALID_HTML_TAGS.forEach((tag) => {
            if (endEndsWith(tag, around) || around.includes('<') || '<'.includes(around)) {
                completionItems.push({
                    label: around.includes('<') || '<'.startsWith(around) ? `<${tag}>` : tag,
                    kind: CompletionItemKind.Property,
                    insertText: `<${tag}$0></${tag}>`,
                    insertTextFormat: InsertTextFormat.Snippet,
                    detail: 'HTML Element',
                    documentation: {
                        kind: MarkupKind.Markdown,
                        value: `Inserts an HTML element with the specified name.`,
                    },
                });
            }
        });
    }

    return completionItems;
};

export const CompletionResolveHandler = (documents: TextDocuments<TextDocument>, params: CompletionItem) => {
    return params;
};
