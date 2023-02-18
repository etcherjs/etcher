import { compileToAST, getExported } from '../src/compiler/index.js';
import { deepEqual, equal } from 'assert';

describe('Syntax-Tree Suite', () => {
    it('should output a valid html syntax tree', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        deepEqual(parsedTemplate.ast, {
            children: [
                {
                    attributes: {},
                    children: [],
                    raw: '<div></div>',
                    selfClosing: false,
                    tag: 'div',
                    type: 'Element',
                },
            ],
            type: 'Root',
        });
    });
    it('should parse embedded event listeners', () => {
        const template = `<div @click={foo}></div>`;

        const parsedTemplate = compileToAST(template);

        equal(
            parsedTemplate.ast.children[0].type === 'Element'
                ? parsedTemplate.ast.children[0].attributes['@click'].isEventHandler
                : false,
            true
        );
    });
    it('should parse interpolated expressions', () => {
        const template = `<div>{{foo}}</div>`;

        const parsedTemplate = compileToAST(template);

        equal(
            parsedTemplate.ast.children[0].type === 'Element'
                ? parsedTemplate.ast.children[0].children[0].type === 'Interpolation'
                : false,
            true
        );
    });
});

describe('Exported JS Suite', () => {
    it('should import required setup functions', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(
            output.split('\n')[1],
            'const {transform: _$transform, template: _$template, listen: _$listen, insert: _$insert} = _$etcherCore'
        );
    });
    it('should properly template html string', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[2], "const temp$ = _$template('etcher-xxx', `<div></div>`)");
    });
    it('should export a transform call', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[3], "export default () => _$transform('etcher-xxx', temp$)");
    });
    it('should register event listeners', () => {
        const template = `<div @click={foo}></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[4], "_$listen('etcher-xxx', node$$0, foo, 'click')");
    });
    it('should update interpolated expressions', () => {
        const template = `<div>{{foo}}</div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[3], 'const node$0 = temp$.childNodes[0].childNodes[0]');

        equal(output.split('\n')[4], "_$insert('etcher-xxx', node$0, temp$, () => foo, )");
    });
});
