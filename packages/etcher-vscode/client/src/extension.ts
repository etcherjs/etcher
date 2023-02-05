import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { workspace, ExtensionContext } from 'vscode';

import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

const findConfig = (
    path: string
): {
    path: string;
    rootPath: string;
} | null => {
    const testPath = path + '/etcher.config.js';

    if (fs.existsSync(testPath)) {
        return {
            path: testPath,
            rootPath: path,
        };
    }

    if (path === '/') {
        return null;
    }

    return findConfig(path.substring(0, path.lastIndexOf('/')));
};

const closestPackage = (path: string): string | null => {
    const testPath = path + '/package.json';

    if (fs.existsSync(testPath)) {
        return path;
    }

    if (path === '/') {
        return null;
    }

    return closestPackage(path.substring(0, path.lastIndexOf('/')));
};

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'));

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
    };
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'etcher' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
        },
    };

    client = new LanguageClient('etcher', 'Etcher', serverOptions, clientOptions);

    client.start();

    const disposable = vscode.commands.registerCommand('etcher-vscode.createComponent', () => {
        const editor = vscode.window.activeTextEditor;

        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            vscode.window
                .showInputBox({
                    placeHolder: 'MyComponent.xtml',
                    prompt: 'Enter file name',
                    validateInput: (value) => {
                        if (!value.endsWith('.xtml')) {
                            return 'File name must end with .xtml';
                        }
                    },
                })
                .then(async (value) => {
                    if (value) {
                        const component = {
                            path: value,
                            content: text,
                        };

                        const config = findConfig(editor.document.fileName);

                        if (config) {
                            const config = findConfig(editor.document.fileName);

                            let configObj: null | {
                                input?: string;
                                output?: string;
                            } = null;

                            if (config) {
                                const data = fs.readFileSync(config.path, 'utf8').replace(/plugins:\s*\[.*?],/s, '');

                                const exported = data.match(/export\s+default\s+(?:defineConfig\()?({[\s\S]*})\)?/);

                                configObj = exported
                                    ? JSON.parse(
                                          exported[1]
                                              .replace(/(\w+):/g, '"$1":')
                                              .replace(/'/g, '"')
                                              .replace(/,\s*}/g, '}')
                                      )
                                    : {
                                          input: 'src',
                                          output: 'public',
                                      };
                            }

                            if (!configObj) {
                                configObj = {
                                    input: 'src',
                                    output: 'public',
                                };
                            }

                            const srcPath = path.join(config.rootPath, configObj?.input || 'src', 'components');

                            if (!fs.existsSync(srcPath)) {
                                vscode.window.showErrorMessage('Could not find src/components directory');
                            }

                            fs.writeFileSync(path.join(srcPath, component.path), component.content);

                            vscode.workspace.openTextDocument(path.join(srcPath, component.path)).then((doc) => {
                                vscode.window.showTextDocument(doc);
                            });

                            return;
                        }

                        const packagePath = closestPackage(editor.document.fileName);

                        if (!packagePath) {
                            vscode.window.showErrorMessage('Could not find a component directory');
                        }

                        const srcPath = path.join(packagePath as string, 'src', 'components');

                        if (!fs.existsSync(srcPath)) {
                            vscode.window.showErrorMessage('Could not find src/components directory');
                        }

                        fs.writeFileSync(path.join(srcPath, component.path), component.content);

                        vscode.workspace.openTextDocument(path.join(srcPath, component.path)).then((doc) => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
