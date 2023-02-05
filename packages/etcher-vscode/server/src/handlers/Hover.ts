import { Hover, HoverParams, MarkupKind, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { retrieveConfig } from '../config';

import * as path from 'path';

export default (documents: TextDocuments<TextDocument>, params: HoverParams) => {
    const text = documents.get(params.textDocument.uri)?.getText();

    if (!text) return;

    const location = params.position;

    const line = text.split('\n')[location.line];

    const pattern = /<etcher-(.*?)[> ]/g;

    const matches = pattern.exec(line);

    if (matches) {
        const config = retrieveConfig(params.textDocument.uri);

        const hover: Hover = {
            contents: {
                kind: MarkupKind.Markdown,
                value: `**Etcher Component**\n\nInserts an etcher component with the specified name. [Go to definition.](${path.join(
                    config.componentsDir,
                    `${matches[1]}.xtml`
                )})\n\n\`\`\`html\n<etcher-${matches[1]}>\n\t...\n</etcher-${matches[1]}>\n\`\`\``,
            },
        };

        return hover;
    }
};
