import {
    CompletionItem,
    Connection,
    HoverParams,
    Location,
    TextDocumentPositionParams,
    TextDocuments,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Settings } from '../constants';

import Etcher from './etcher';
import Css from './css';

export default {
    Hover: (documents: TextDocuments<TextDocument>, params: HoverParams) => {
        const etcher = Etcher.Hover(documents, params);
        const css = Css.Hover(documents, params);

        if (etcher) return etcher;
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

        if (!etcher && !css) return [];

        return [...(etcher || []), ...(css || [])];
    },
    Completion: (
        settings: Settings,
        documents: TextDocuments<TextDocument>,
        textDocumentPosition: TextDocumentPositionParams
    ): CompletionItem[] => {
        const etcher = Etcher.Completion(settings, documents, textDocumentPosition);
        const css = Css.Completion(settings, documents, textDocumentPosition);

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
