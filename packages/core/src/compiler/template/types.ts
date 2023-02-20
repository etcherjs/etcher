import { Expression } from '../js/types';

export type Node =
    | RootNode
    | ElementNode
    | TextNode
    | CommentNode
    | ConditionalExpression
    | ForLoop
    | IndexLoop
    | Interpolation;

export type RootNode = {
    type: 'Root';
    children: Array<Node>;
};

export type ElementNode = {
    type: 'Element';
    raw: string;
    tag: string;
    attributes: {
        [key: string]: {
            default?: boolean;
            key: string;
            value: string;
            inline: boolean;
            isComputed: boolean;
            isEventHandler: boolean;
        };
    };
    selfClosing: boolean;
    children: Array<Node>;
};

export type TextNode = {
    type: 'Text';
    data: string;
};

export type CommentNode = {
    type: 'Comment';
    data: string;
};

export type Interpolation = {
    type: 'Interpolation';
    expression: string;
};

export type ConditionalExpression = {
    type: 'Conditional';
    condition: Expression;
    consequent: Array<Node>;
    alternate: Array<Node>;
};

export type ForLoop = {
    type: 'Each';
    expression: Expression;
    label: string;
    value: string;
    children: Array<Node>;
};

export type IndexLoop = {
    type: 'EachIndex';
    expression: Expression;
    children: Array<Node>;
};

export const create = (
    raw: string,
    tag: string,
    props: {
        [key: string]: {
            default?: boolean;
            key: string;
            value: string;
            inline: boolean;
            isComputed: boolean;
            isEventHandler: boolean;
        };
    },
    selfClosing: boolean,
    ...children: Array<Node>
): ElementNode => {
    return {
        type: 'Element',
        tag: tag,
        raw: raw,
        attributes: props,
        selfClosing: selfClosing,
        children: children,
    };
};

export const createRoot = (nodes: Array<Node>): RootNode => {
    return {
        type: 'Root',
        children: nodes,
    };
};

export const createText = (data: string): TextNode => {
    return {
        type: 'Text',
        data: data,
    };
};

export const createComment = (data: string): CommentNode => {
    return {
        type: 'Comment',
        data: data,
    };
};

export const createInterpolation = (expression: string): Interpolation => {
    return {
        type: 'Interpolation',
        expression: expression.trim(),
    };
};

export const createConditional = (
    condition: Expression,
    consequent: Array<Node>,
    alternate: Array<Node>
): ConditionalExpression => {
    return {
        type: 'Conditional',
        condition: condition,
        consequent: consequent,
        alternate: alternate,
    };
};

export const createForLoop = (expression: Expression, label: string, value: string, children: Array<Node>): ForLoop => {
    return {
        type: 'Each',
        expression: expression,
        label: label,
        value: value,
        children: children,
    };
};

export const createIndexLoop = (expression: Expression, children: Array<Node>): IndexLoop => {
    return {
        type: 'EachIndex',
        expression: expression,
        children: children,
    };
};

export const isElement = (node: Node): node is ElementNode => {
    return node.type === 'Element';
};

export const isText = (node: Node): node is TextNode => {
    return node.type === 'Text';
};

export const isComment = (node: Node): node is CommentNode => {
    return node.type === 'Comment';
};

export const isConditional = (node: Node): node is ConditionalExpression => {
    return node.type === 'Conditional';
};

export const isForLoop = (node: Node): node is ForLoop => {
    return node.type === 'Each';
};

export const isIndexLoop = (node: Node): node is IndexLoop => {
    return node.type === 'EachIndex';
};

export const isRoot = (node: Node): node is RootNode => {
    return node.type === 'Root';
};

export const isNode = (node: any): node is Node => {
    return node && typeof node === 'object' && 'type' in node;
};
