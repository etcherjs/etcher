import { DefinitionParams, TextDocuments, Location } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { retrieveConfig } from '../config';

import * as path from 'path';
import * as fs from 'fs';

export default (documents: TextDocuments<TextDocument>, params: DefinitionParams) => {
    const config = retrieveConfig(params.textDocument.uri);

    const text = documents.get(params.textDocument.uri)?.getText();

    if (!text) return;

    const pattern = /<etcher-(.*?)[> ]/g;
    let matches: RegExpExecArray | null;

    const locations: Location[] = [];

    while ((matches = pattern.exec(text))) {
        if (fs.existsSync(path.join(config.componentsDir, `${matches[1]}.xtml`))) {
            const location: Location = {
                uri: new URL(`file://${path.join(config.componentsDir, `${matches[1]}.xtml`)}`).toString(),
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
            };

            locations.push(location);
        }
    }

    return locations;
};
