"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const findConfig = (path) => {
    const testPath = path + '/etcher.config.js';
    if (fs_1.default.existsSync(testPath)) {
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
const closestPackage = (path) => {
    const testPath = path + '/package.json';
    if (fs_1.default.existsSync(testPath)) {
        return path;
    }
    if (path === '/') {
        return null;
    }
    return closestPackage(path.substring(0, path.lastIndexOf('/')));
};
function activate(context) {
    console.log('Active');
    const provider = vscode.languages.registerCompletionItemProvider('etcher', {
        provideCompletionItems(document, position) {
            const editor = vscode.window.activeTextEditor;
            const line = editor?.document.lineAt(position.line).text;
            const char = line?.charAt(position.character - 1);
            if (editor) {
                const config = findConfig(editor.document.fileName);
                let configObj = null;
                if (config) {
                    const data = fs_1.default.readFileSync(config.path, 'utf8');
                    const exported = data.match(/export\s+default\s+(?:defineConfig\()?({[\s\S]*})\)?/);
                    configObj = exported
                        ? JSON.parse(exported[1]
                            .replace(/(\w+):/g, '"$1":')
                            .replace(/'/g, '"')
                            .replace(/,\s*}/g, '}'))
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
                const componentsDir = path_1.default.join(config?.rootPath || closestPackage(editor.document.fileName) || '', configObj?.input || 'src', 'components');
                const files = fs_1.default.readdirSync(componentsDir);
                const items = files.map((file) => {
                    const name = file.replace('.xtml', '');
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
                    item.insertText = new vscode.SnippetString(`${char === '<' ? '' : '<'}etcher-${name}>$1</etcher-${name}>`);
                    item.documentation = new vscode.MarkdownString(`Inserts a \`<${name}/>\` component, which is defined at [\`${configObj?.input || 'src'}/components/${file}\`](file://${path_1.default.join(componentsDir, file)}).`);
                    return item;
                });
                return items;
            }
        },
    }, '<', '');
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
                        const srcPath = path_1.default.join(config.rootPath, data?.default?.srcDir || 'src', 'components');
                        if (!fs_1.default.existsSync(srcPath)) {
                            vscode.window.showErrorMessage('Could not find src/components directory');
                        }
                        fs_1.default.writeFileSync(path_1.default.join(srcPath, component.path), component.content);
                        vscode.workspace.openTextDocument(path_1.default.join(srcPath, component.path)).then((doc) => {
                            vscode.window.showTextDocument(doc);
                        });
                        return;
                    }
                    const packagePath = closestPackage(editor.document.fileName);
                    if (!packagePath) {
                        vscode.window.showErrorMessage('Could not find a component directory');
                    }
                    const srcPath = path_1.default.join(packagePath, 'src', 'components');
                    if (!fs_1.default.existsSync(srcPath)) {
                        vscode.window.showErrorMessage('Could not find src/components directory');
                    }
                    fs_1.default.writeFileSync(path_1.default.join(srcPath, component.path), component.content);
                    vscode.workspace.openTextDocument(path_1.default.join(srcPath, component.path)).then((doc) => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map