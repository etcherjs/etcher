export type Statement =
    | Expression
    | Raw
    | CallExpression
    | Identifier
    | Literal
    | Assignment
    | Comment
    | FunctionDeclaration
    | LineBreak;

export type Expression = {
    type: 'Expression';
    value: Identifier | Literal | CallExpression | FunctionDeclaration | Raw;
    inline?: boolean;
};

export type Raw = {
    type: 'Raw';
    value: string;
};

export type CallExpression = {
    type: 'CallExpression';
    callee: Expression | Identifier;
    args: Array<Expression>;
};

export type Assignment = {
    type: 'Assignment';
    left: Expression;
    right: Expression;
    operator: '=' | '+=' | '-=' | '*=' | '/=' | '%=';
    mode?: 'constant' | 'variable';
};

export type Comment = {
    type: 'Comment';
    value: string;
};

export type FunctionDeclaration = {
    type: 'FunctionDeclaration';
    id: Identifier | null;
    anonymous?: boolean;
    params: Array<Identifier>;
    body: string;
};

export type Identifier = {
    type: 'Identifier';
    name: string;
    value?: string;
};

export type StringLiteral = {
    type: 'Literal';
    subType: 'String';
    value: string;
};

export type NumberLiteral = {
    type: 'Literal';
    subType: 'Number';
    value: number;
};

export type ObjectLiteral = {
    type: 'Literal';
    subType: 'Object';
    value: Identifier[];
};

export type ArrayLiteral = {
    type: 'Literal';
    subType: 'Array';
    value: Array<Expression>;
};

export type BooleanLiteral = {
    type: 'Literal';
    subType: 'Boolean';
    value: boolean;
};

export type NullLiteral = {
    type: 'Literal';
    subType: 'Null';
    value: null;
};

export type LineBreak = {
    type: 'LineBreak';
};

export type Literal = StringLiteral | NumberLiteral | ObjectLiteral | ArrayLiteral | BooleanLiteral | NullLiteral;

export const callExpression = (callee: Expression | Identifier, args: Array<Expression>): CallExpression => {
    return {
        type: 'CallExpression',
        callee,
        args: args,
    };
};

export const raw = (value: string): Raw => {
    return {
        type: 'Raw',
        value,
    };
};

export const assignment = (
    left: Expression,
    right: Expression,
    operator: '=' | '+=' | '-=' | '*=' | '/=' | '%=' = '=',
    options?: { mode: 'constant' | 'variable' }
): Assignment => {
    return {
        type: 'Assignment',
        mode: options.mode || 'variable',
        operator,
        left,
        right,
    };
};

export const comment = (value: string): Comment => {
    return {
        type: 'Comment',
        value,
    };
};

export const identifier = (name: string): Identifier => {
    return {
        type: 'Identifier',
        name,
    };
};

export const stringLiteral = (
    value: string,
    options: {
        mode?: 'string' | 'template';
    } = {
        mode: 'string',
    }
): StringLiteral => {
    return {
        type: 'Literal',
        subType: 'String',
        value: options.mode === 'template' ? `\`${value}\`` : `'${value}'`,
    };
};

export const numberLiteral = (value: number): NumberLiteral => {
    return {
        type: 'Literal',
        subType: 'Number',
        value,
    };
};

export const objectLiteral = (value: Identifier[]): ObjectLiteral => {
    return {
        type: 'Literal',
        subType: 'Object',
        value,
    };
};

export const arrayLiteral = (value: Array<Expression>): ArrayLiteral => {
    return {
        type: 'Literal',
        subType: 'Array',
        value,
    };
};

export const booleanLiteral = (value: boolean): BooleanLiteral => {
    return {
        type: 'Literal',
        subType: 'Boolean',
        value,
    };
};

export const nullLiteral = (): NullLiteral => {
    return {
        type: 'Literal',
        subType: 'Null',
        value: null,
    };
};

export const literal = (
    value: string | number | object | boolean | null,
    options?: {
        mode: 'template' | 'string';
    }
): Literal => {
    if (typeof value === 'string') {
        return stringLiteral(value, options);
    } else if (typeof value === 'number') {
        return numberLiteral(value);
    } else if (typeof value === 'boolean') {
        return booleanLiteral(value);
    } else {
        return nullLiteral();
    }
};

export const functionDeclaration = (
    id: Identifier | null,
    params: Array<Identifier>,
    body: string
): FunctionDeclaration => {
    return {
        type: 'FunctionDeclaration',
        anonymous: !id,
        id,
        params,
        body,
    };
};

export const expression = (
    value: Identifier | Literal | CallExpression | FunctionDeclaration | Raw,
    inline: boolean = true
): Expression => {
    return {
        type: 'Expression',
        value,
        inline,
    };
};

export const lineBreak = (): LineBreak => {
    return {
        type: 'LineBreak',
    };
};
