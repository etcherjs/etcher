import * as vscode from 'vscode';

import fs from 'fs';
import path from 'path';

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

export function activate(context: vscode.ExtensionContext) {
    console.log('Active');

    const provider = vscode.languages.registerCompletionItemProvider(
        'etcher',
        {
            provideCompletionItems(document, position) {
                const editor = vscode.window.activeTextEditor;

                const line = editor?.document.lineAt(position.line).text;

                const char = line?.charAt(position.character - 1);

                if (editor) {
                    const config = findConfig(editor.document.fileName);

                    let configObj: null | {
                        input?: string;
                        output?: string;
                    } = null;

                    if (config) {
                        const data = fs.readFileSync(config.path, 'utf8');

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

                    const componentsDir = path.join(
                        config?.rootPath || closestPackage(editor.document.fileName) || '',
                        configObj?.input || 'src',
                        'components'
                    );

                    const files = fs.readdirSync(componentsDir);

                    const items = files.map((file) => {
                        const name = file.replace('.xtml', '');

                        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
                        item.insertText = new vscode.SnippetString(
                            `${char === '<' ? '' : '<'}etcher-${name}>$1</etcher-${name}>`
                        );
                        item.documentation = new vscode.MarkdownString(
                            `Inserts a \`<${name}/>\` component, which is defined at [\`${
                                configObj?.input || 'src'
                            }/components/${file}\`](file://${path.join(componentsDir, file)}).`
                        );

                        return item;
                    });

                    return items;
                }
            },
        },
        '<',
        ''
    );

    context.subscriptions.push(provider);

    let disposable = vscode.commands.registerCommand('etcher-vscode.createComponent', () => {
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
                            const data = await import(config.path);

                            const srcPath = path.join(config.rootPath, data?.default?.srcDir || 'src', 'components');

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

export function deactivate() {}
