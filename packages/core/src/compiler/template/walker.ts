import { Node } from './types.js';

export const walkFrom = (ast: Node[], to: Node): number[] => {
    const path = [];

    let renderedAst = ast
        .map((node) => {
            if (node.type === 'Element' && node.tag === 'script') {
                return null;
            }

            if (node.type === 'Comment') {
                return null;
            }

            return node;
        })
        .filter(Boolean);

    for (let i = 0; i < renderedAst.length; i++) {
        const node = renderedAst[i];

        if (node === to) {
            path.push(i);

            return path;
        }

        if (node.type === 'Element' && node.children.length) {
            const childPath = walkFrom(node.children, to);

            if (childPath.length) {
                path.push(i);
                path.push(...childPath);

                return path;
            }
        }
    }

    return path;
};

export const walkKeyword = (arr: number[]): string => {
    let keyword = '';

    for (let i = 0; i < arr.length; i++) {
        const index = arr[i];

        keyword += `.childNodes[${index}]`;
    }

    return keyword;
};
