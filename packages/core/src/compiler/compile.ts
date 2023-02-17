import {
    assignment,
    callExpression,
    expression,
    identifier,
    literal,
    functionDeclaration,
    Statement,
    objectLiteral,
    comment,
    lineBreak,
    raw as createRaw,
} from './js/types.js';
import { htmlFrom, parseHTMLTemplate, reverseTransformVoid } from './template/index.js';
import { createRoot, Node, RootNode, TextNode } from './template/types.js';
import { walkFrom, walkKeyword } from './template/walker.js';
import { jsFrom, unique } from './js/index.js';

type CompilerOptions = {
    mode?: 'component' | 'page';
    filename?: string;
    experimental?: {};
};

type CodegenResult = {
    ast: RootNode;
    findNodes: (tag: string) => Node[];
    findTextContent: (tag: string) => string[];
};

export const compileToAST = (template: string, options?: CompilerOptions): CodegenResult => {
    const ast = parseHTMLTemplate(template);

    const findNodes = (tag: string) => {
        let list: Node[] = [];

        const find = (nodes: Node[]) => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];

                if (node.type !== 'Element') continue;

                find(node.children);

                if (node.tag !== tag) continue;

                list.push(node);
            }
        };

        find(ast);

        return list;
    };

    const findTextContent = (tag: string) => {
        let list: string[] = [];

        const find = (nodes: Node[]) => {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];

                if (node.type !== 'Element') continue;

                find(node.children);

                if (node.tag !== tag) continue;

                list.push(
                    node.children
                        .map((c) => c.type === 'Text' && c.data)
                        .filter(Boolean)
                        .join('\n')
                );
            }
        };

        find(ast);

        return list;
    };

    return {
        ast: createRoot(ast),
        findNodes,
        findTextContent,
    };
};

export const getExported = (id: string, ast: RootNode, existing?: string): string => {
    let exprts: Statement[] = [];

    const raw = reverseTransformVoid(
        htmlFrom(ast.children.map((n: Node) => (n.type === 'Element' && n.tag !== 'script' ? n : null)))
    );

    const GLOBAL_TRANSFORM = unique('_$transform', existing || '');
    const GLOBAL_TEMPLATE = unique('_$template', existing || '');
    const GLOBAL_LISTEN = unique('_$listen', existing || '');
    const GLOBAL_INSERT = unique('_$insert', existing || '');

    exprts.push(
        assignment(
            expression(
                objectLiteral([
                    identifier(`transform: ${GLOBAL_TRANSFORM}`),
                    identifier(`template: ${GLOBAL_TEMPLATE}`),
                    identifier(`listen: ${GLOBAL_LISTEN}`),
                    identifier(`insert: ${GLOBAL_INSERT}`),
                ])
            ),
            expression(identifier('_$etcherCore')),
            '=',
            {
                mode: 'constant',
            }
        ),
        lineBreak()
    );

    const templateId = unique('temp$', existing || '');

    exprts.push(
        assignment(
            expression(identifier(templateId)),
            expression(
                callExpression(identifier(GLOBAL_TEMPLATE), [
                    expression(literal(id)),
                    expression(
                        literal(raw.replaceAll(/^[\s\n]+/gm, '').replace('\n', ''), {
                            mode: 'template',
                        })
                    ),
                ])
            ),
            '=',
            {
                mode: 'constant',
            }
        ),
        lineBreak()
    );

    let INTERPOLATION_COUNT = 0;
    let EVENT_COUNT = 0;

    const process = (node: Node, parent: Node, path: number[]) => {
        switch (node.type) {
            case 'Element': {
                const { tag, attributes, children } = node;

                if (tag === 'script') {
                    const content = reverseTransformVoid(children.map((c: TextNode) => c.data).join('\n'), true);

                    const scriptComment = unique('SCRIPT_$', existing || '');

                    exprts.splice(
                        1,
                        0,
                        lineBreak(),
                        comment(scriptComment),
                        lineBreak(),
                        createRaw(content.trim().replace(/^\s+/gm, '')),
                        lineBreak(),
                        comment(`END${scriptComment}`),
                        lineBreak()
                    );
                }

                for (let j = 0; j < Object.keys(attributes).length; j++) {
                    const attr = attributes[Object.keys(attributes)[j]];

                    if (attr.isEventHandler) {
                        const path = walkFrom(ast.children, node);

                        const nodeName = unique(`node$$${EVENT_COUNT}`, existing || '');

                        exprts.push(
                            assignment(
                                expression(identifier(nodeName)),
                                expression(identifier(templateId + walkKeyword(path))),
                                '=',
                                {
                                    mode: 'constant',
                                }
                            ),
                            lineBreak()
                        );

                        exprts.push(
                            callExpression(identifier(GLOBAL_LISTEN), [
                                expression(literal(id)),
                                expression(identifier(nodeName)),
                                attr.inline
                                    ? expression(createRaw(reverseTransformVoid(attr.value, true)))
                                    : expression(createRaw(reverseTransformVoid(attr.value, true))),
                                expression(literal(attr.key)),
                            ]),
                            lineBreak()
                        );
                    }

                    if (attr.isComputed) {
                    }
                }

                break;
            }
            case 'Interpolation': {
                const path = walkFrom(ast.children, node);

                const nodeName = unique(`node$${INTERPOLATION_COUNT}`, existing || '');

                exprts.push(
                    assignment(
                        expression(identifier(nodeName)),
                        expression(identifier(templateId + walkKeyword(path))),
                        '=',
                        {
                            mode: 'constant',
                        }
                    ),
                    lineBreak()
                );

                exprts.push(
                    callExpression(identifier(GLOBAL_INSERT), [
                        expression(literal(id)),
                        expression(identifier(nodeName)),
                        expression(identifier(templateId)),
                        expression(
                            createRaw(
                                `() => ${node.expression.replace(
                                    /\(\)$/,
                                    `('_$etcherCore.c["${id}"]?.shadowRoot${walkKeyword(path)}')`
                                )}`
                            )
                        ),
                    ]),
                    lineBreak()
                );

                INTERPOLATION_COUNT++;

                break;
            }
        }

        if (node.type === 'Element' && node.children) {
            for (let j = 0; j < node.children.length; j++) {
                const child = node.children[j];

                process(child, node, path.concat(j));
            }
        }
    };

    for (let i = 0; i < ast.children.length; i++) {
        const node = ast.children[i];

        process(node, ast, [i]);
    }

    exprts.push(createRaw(`export default () => ${GLOBAL_TRANSFORM}('${id}', ${templateId})`));

    return jsFrom(exprts);
};
