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
    it('should parse computed attributes', () => {
        const template = `<div #class={foo}></div>`;
        const template1 = `<div class={foo}></div>`;

        const parsedTemplate = compileToAST(template);
        const parsedTemplate1 = compileToAST(template1);

        equal(
            parsedTemplate.ast.children[0].type === 'Element'
                ? parsedTemplate.ast.children[0].attributes['#class'].isComputed
                : false,
            true
        );
        equal(
            parsedTemplate1.ast.children[0].type === 'Element'
                ? parsedTemplate1.ast.children[0].attributes['class'].isComputed
                : false,
            true
        );
    });
    it('should escape computed expressions', () => {
        const template = `<div #class={foo > 1 ? true : false}></div>`;

        const parsedTemplate = compileToAST(template);

        equal(
            parsedTemplate.ast.children[0].type === 'Element'
                ? parsedTemplate.ast.children[0].attributes['#class'].value
                : false,
            'foo&wsp;&gt;&wsp;1&wsp;?&wsp;true&wsp;:&wsp;false'
        );
    });
});

describe('Exported JS Suite', () => {
    it('should import required setup functions', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(
            output.split('\n')[2],
            'const {transform: _$transform, template: _$template, listen: _$listen, insert: _$insert} = _$etcherCore'
        );
    });
    it('should create a component function', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[5], "const __COMP__ = (__$index__, $) => {");
    });
    it('should properly template html string', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[7], "const temp$ = _$template('etcher-xxx', `<div></div>`)");
    });
    it('should export a transform call', () => {
        const template = `<div></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[12], "export default () => _$transform('etcher-xxx', __COMP__)");
    });
    it('should register event listeners', () => {
        const template = `<div @click={foo}></div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[10], "_$listen('etcher-xxx', node$$0, foo, 'click')");
    });
    it('should update interpolated expressions', () => {
        const template = `<div>{{foo}}</div>`;

        const parsedTemplate = compileToAST(template);

        const output = getExported('etcher-xxx', parsedTemplate.ast);

        equal(output.split('\n')[9], 'const node$0 = temp$.childNodes[0].childNodes[0]');

        equal(output.split('\n')[10], "_$insert('etcher-xxx', node$0, temp$, () => foo, )");
    });
});
