import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    HoverParams,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { Settings } from './constants';
import Handlers from './handlers';

const connection = createConnection(ProposedFeatures.all);

const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;

    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
            },
            definitionProvider: true,
            hoverProvider: true,
        },
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
});

const defaultSettings: Settings = { lint: true, emmet: true };
let globalSettings: Settings = defaultSettings;

const documentSettings: Map<string, Thenable<Settings>> = new Map();

connection.onDidChangeConfiguration((change) => {
    if (hasConfigurationCapability) {
        documentSettings.clear();
    } else {
        globalSettings = <Settings>(change.settings.languageServerExample || defaultSettings);
    }

    documents.all().forEach((d) => Handlers.Validate(globalSettings, connection, d));
});

function getDocumentSettings(resource: string): Thenable<Settings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'etcher-vscode',
        });
        documentSettings.set(resource, result);
    }
    return result;
}

documents.onDidClose((e) => {
    documentSettings.delete(e.document.uri);
});

documents.onDidChangeContent(async (change) => {
    Handlers.Validate(await getDocumentSettings(change.document.uri), connection, change.document);
});

connection.onDefinition((params) => {
    return Handlers.Definition(documents, params);
});

connection.onHover((params: HoverParams) => {
    return Handlers.Hover(documents, params);
});

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    return Handlers.Completion(globalSettings, documents, textDocumentPosition);
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    return Handlers.CompletionResolve(documents, item);
});

documents.listen(connection);

connection.listen();
