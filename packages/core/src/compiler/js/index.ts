import { raw, Statement } from './types.js';

let UNIQUE_SET = new Set();

export const unique = (transform: string, document: string): string => {
    if (document.indexOf(transform) === -1) {
        return transform;
    }

    if (UNIQUE_SET.has(transform)) {
        return unique(transform, document);
    }

    UNIQUE_SET.add(transform);

    let i = 0;

    while (true) {
        const unique = `${transform}${i}`;

        if (document.indexOf(unique) === -1) {
            return unique;
        }

        i++;
    }
};

export const jsFrom = (ast: Statement[]): string => {
    let code = '';

    for (let i = 0; i < ast.length; i++) {
        const node = ast[i];

        switch (node.type) {
            case 'FunctionDeclaration': {
                const { id, params, body } = node;

                code += ``;
                code += body;
                code += '}\n';
                break;
            }
            case 'Expression': {
                const { value } = node;

                code += jsFrom([value]);
                break;
            }
            case 'Raw': {
                const { value } = node;

                code += value;
                break;
            }
            case 'CallExpression': {
                const { callee, args } = node;

                code += jsFrom([callee]);
                code += '(';
                code += raw(args.map((arg) => jsFrom([arg])).join(', ')).value;
                code += ')';
                break;
            }
            case 'Comment': {
                const { value } = node;

                code += `/* ${value} */`;
                break;
            }
            case 'Identifier': {
                const { name } = node;

                code += name;
                break;
            }
            case 'Export': {
                const { value } = node;

                code += `export ${jsFrom([value])}`;

                break;
            }
            case 'Literal': {
                const { value, subType } = node;

                switch (subType) {
                    case 'String':
                    case 'Number': {
                        code += value;
                        break;
                    }
                    case 'Object': {
                        code += '{';

                        for (let j = 0; j < value.length; j++) {
                            const prop = value[j];

                            code += `${prop.name}${prop.value ? `: ${prop.value}` : ''}`;

                            if (j < value.length - 1) {
                                code += ', ';
                            }
                        }

                        code += '}';
                        break;
                    }
                    case 'Array': {
                        code += '[';

                        for (let j = 0; j < value.length; j++) {
                            const item = value[j];

                            code += `${jsFrom([item])}`;

                            if (j < value.length - 1) {
                                code += ', ';
                            }
                        }

                        code += ']';
                        break;
                    }
                    case 'Boolean': {
                        code += value ? 'true' : 'false';
                        break;
                    }
                }

                break;
            }
            case 'Assignment': {
                const { left, right, operator, mode } = node;

                if (mode === 'constant') {
                    code += 'const ';
                } else if (mode === 'variable') {
                    code += 'let ';
                }

                code += jsFrom([left]);
                code += ` ${operator} `;
                code += jsFrom([right]);
                break;
            }
            case 'LineBreak': {
                code += '\n';
            }
        }
    }

    return code;
};
