import {
    getCSSLanguageService,
    getLESSLanguageService,
    getSCSSLanguageService,
    type LanguageService,
    type LanguageServiceOptions,
} from 'vscode-css-languageservice';
import {
    CompletionItem,
    Connection,
    HoverParams,
    Location,
    TextDocumentPositionParams,
    TextDocuments,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractFromDocument } from './extract';
import { retrieveConfig } from '../../config';
import { Settings } from '../../constants';

export default {
    Hover: (documents: TextDocuments<TextDocument>, params: HoverParams) => {
        const config = retrieveConfig(params.textDocument.uri);

        const cssLanguageService: LanguageService = getCSSLanguageService();
        const lessLanguageService: LanguageService = getLESSLanguageService();
        const scssLanguageService: LanguageService = getSCSSLanguageService();

        const document = documents.get(params.textDocument.uri);

        if (!document) return;

        const text = extractFromDocument(document);

        if (!text) return;

        const stylesheet = cssLanguageService.parseStylesheet(TextDocument.create(document.uri, 'css', 0, text));

        const cssLanguageServiceResult = cssLanguageService.doHover(document, params.position, stylesheet);
        const lessLanguageServiceResult = lessLanguageService.doHover(document, params.position, stylesheet);
        const scssLanguageServiceResult = scssLanguageService.doHover(document, params.position, stylesheet);

        if (cssLanguageServiceResult) return cssLanguageServiceResult;
        if (lessLanguageServiceResult) return lessLanguageServiceResult;
        if (scssLanguageServiceResult) return scssLanguageServiceResult;
    },
    Validate: (settings: Settings, connection: Connection, document: TextDocument) => {
        const config = retrieveConfig(document.uri);

        const cssLanguageService: LanguageService = getCSSLanguageService();
        const lessLanguageService: LanguageService = getLESSLanguageService();
        const scssLanguageService: LanguageService = getSCSSLanguageService();

        const text = extractFromDocument(document);

        if (!text) return;

        const stylesheet = cssLanguageService.parseStylesheet(TextDocument.create(document.uri, 'css', 0, text));

        const cssLanguageServiceResult = cssLanguageService.doValidation(document, stylesheet);
        const lessLanguageServiceResult = lessLanguageService.doValidation(document, stylesheet);
        const scssLanguageServiceResult = scssLanguageService.doValidation(document, stylesheet);

        if (cssLanguageServiceResult) return cssLanguageServiceResult;
        if (lessLanguageServiceResult) return lessLanguageServiceResult;
        if (scssLanguageServiceResult) return scssLanguageServiceResult;
    },
    Definition: (documents: TextDocuments<TextDocument>, params: HoverParams): Location[] => {
        const config = retrieveConfig(params.textDocument.uri);

        const cssLanguageService: LanguageService = getCSSLanguageService();
        const lessLanguageService: LanguageService = getLESSLanguageService();
        const scssLanguageService: LanguageService = getSCSSLanguageService();

        const document = documents.get(params.textDocument.uri);

        if (!document) return [];

        const text = extractFromDocument(document);

        if (!text) return [];

        const stylesheet = cssLanguageService.parseStylesheet(TextDocument.create(document.uri, 'css', 0, text));

        const cssLanguageServiceResult = cssLanguageService.findDefinition(document, params.position, stylesheet);
        const lessLanguageServiceResult = lessLanguageService.findDefinition(document, params.position, stylesheet);
        const scssLanguageServiceResult = scssLanguageService.findDefinition(document, params.position, stylesheet);

        let result: Location[] = [];

        if (cssLanguageServiceResult) result = [...result, cssLanguageServiceResult];
        if (lessLanguageServiceResult) result = [...result, lessLanguageServiceResult];
        if (scssLanguageServiceResult) result = [...result, scssLanguageServiceResult];

        return result;
    },
    Completion: (
        settings: Settings,
        documents: TextDocuments<TextDocument>,
        textDocumentPosition: TextDocumentPositionParams
    ): CompletionItem[] => {
        const config = retrieveConfig(textDocumentPosition.textDocument.uri);

        const cssLanguageService: LanguageService = getCSSLanguageService();
        const lessLanguageService: LanguageService = getLESSLanguageService();
        const scssLanguageService: LanguageService = getSCSSLanguageService();

        const document = documents.get(textDocumentPosition.textDocument.uri);

        if (!document) return [];

        const text = extractFromDocument(document);

        if (!text) return [];

        const stylesheet = cssLanguageService.parseStylesheet(TextDocument.create(document.uri, 'css', 0, text));

        const cssLanguageServiceResult = cssLanguageService.doComplete(
            document,
            textDocumentPosition.position,
            stylesheet
        );
        const lessLanguageServiceResult = lessLanguageService.doComplete(
            document,
            textDocumentPosition.position,
            stylesheet
        );
        const scssLanguageServiceResult = scssLanguageService.doComplete(
            document,
            textDocumentPosition.position,
            stylesheet
        );

        if (!cssLanguageServiceResult && !lessLanguageServiceResult && !scssLanguageServiceResult) return [];

        const items = [
            ...(cssLanguageServiceResult ? cssLanguageServiceResult.items : []),
            ...(lessLanguageServiceResult ? lessLanguageServiceResult.items : []),
            ...(scssLanguageServiceResult ? scssLanguageServiceResult.items : []),
        ].reduce((acc, current) => {
            const x = acc.find((item) => item.label === current.label);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, [] as CompletionItem[]);

        return items;
    },
    CompletionResolve: (documents: TextDocuments<TextDocument>, item: CompletionItem): CompletionItem => {
        return item;
    },
};
