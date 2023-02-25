import {
    CompletionItem,
    Connection,
    HoverParams,
    Location,
    Position,
    TextDocumentPositionParams,
    TextDocuments,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Settings } from '../constants';

import Etcher from './etcher';
import Css from './css';

const isWithinTag = (document: TextDocument, position: Position, tag: string) => {
    const before = document.getText().substring(0, document.offsetAt(position));
    const after = document.getText().substring(document.offsetAt(position));

    const openIndex = before.lastIndexOf(`<${tag}`);
    const closeIndex = after.indexOf(`</${tag}>`);

    if (openIndex === -1 || closeIndex === -1) return false;

    if (closeIndex > openIndex) return false;

    return true;
};

export default {
    Hover: (documents: TextDocuments<TextDocument>, params: HoverParams) => {
        const etcher = Etcher.Hover(documents, params);
        const css = Css.Hover(documents, params);

        const document = documents.get(params.textDocument.uri);

        if (!document) return;

        const inStyle = isWithinTag(document, params.position, 'style');

        if (etcher) return etcher;

        if (!inStyle) return;

        if (css) return css;
    },
    Validate: (settings: Settings, connection: Connection, document: TextDocument) => {
        const etcher = Etcher.Validate(settings, connection, document);
        const css = Css.Validate(settings, connection, document);

        if (etcher) return etcher;
        if (css) return css;
    },
    Definition: (documents: TextDocuments<TextDocument>, params: HoverParams): Location[] => {
        const etcher = Etcher.Definition(documents, params);
        const css = Css.Definition(documents, params);

        const document = documents.get(params.textDocument.uri);

        if (!document) return [];

        const inStyle = isWithinTag(document, params.position, 'style');

        if (!etcher && !css) return [];

        if (!inStyle) return etcher || [];

        return [...(etcher || []), ...(css || [])];
    },
    Completion: (
        settings: Settings,
        documents: TextDocuments<TextDocument>,
        textDocumentPosition: TextDocumentPositionParams
    ): CompletionItem[] => {
        const etcher = Etcher.Completion(settings, documents, textDocumentPosition);
        const css = Css.Completion(settings, documents, textDocumentPosition);

        const document = documents.get(textDocumentPosition.textDocument.uri);

        if (!document) return [];

        const inStyle = isWithinTag(document, textDocumentPosition.position, 'style');

        if (inStyle) return css || [];

        return [...(etcher || []), ...(css || [])];
    },
    CompletionResolve: (documents: TextDocuments<TextDocument>, item: CompletionItem): CompletionItem => {
        const etcher = Etcher.CompletionResolve(documents, item);
        const css = Css.CompletionResolve(documents, item);

        if (etcher) return etcher;
        if (css) return css;

        return item;
    },
};
