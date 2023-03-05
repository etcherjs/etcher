import { Connection, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { retrieveConfig } from '../../config';

import * as path from 'path';
import * as fs from 'fs';
import { TextDocument } from 'vscode-languageserver-textdocument';

export default async function validateXTMLDocument(
    settings: {
        lint: boolean;
    },
    connection: Connection,
    xtmlDocument: TextDocument
): Promise<void> {
    const config = retrieveConfig(xtmlDocument.uri);

    if (!settings.lint) return;

    if (!config) return;

    const text = xtmlDocument.getText();

    const patternList = [
        {
            pattern: /<etcher-(.*?)[> ]/g,
            severity: DiagnosticSeverity.Warning,
            message: `Etcher: No component named '$1' found.`,
            id: 'component-not-found',
        },
        {
            pattern: /\{\{\$\..*?(\..*?)\}\}/g,
            severity: DiagnosticSeverity.Error,
            message: `Etcher: Do not attempt to directly access the value of a scoped item from an interpolated expression.`,
            id: 'scoped-item-access',
        },
    ];

    let matches: RegExpExecArray | null;

    const diagnostics: Diagnostic[] = [];

    for (const pattern of patternList) {
        while ((matches = pattern.pattern.exec(text))) {
            if (!fs.existsSync(path.join(config.componentsDir, `${matches[1]}.xtml`))) {
                const diagnostic: Diagnostic = {
                    severity: pattern.severity,

                    range: {
                        start: xtmlDocument.positionAt(matches.index),
                        end: xtmlDocument.positionAt(matches.index + matches[0].length),
                    },
                    message: pattern.message.replace('$1', matches[1]),
                    source: `etcher(${pattern.id})`,
                };
                diagnostics.push(diagnostic);
            }
        }
    }

    connection.sendDiagnostics({ uri: xtmlDocument.uri, diagnostics });
}
