import { preserveShebangs } from 'rollup-plugin-preserve-shebangs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';

export default defineConfig([
    {
        input: 'src/index.ts',
        external: ['vite'],
        plugins: [
            typescript(),
            nodeResolve({
                exportConditions: ['node'],
            }),
            terser(),
            preserveShebangs(),
        ],
        output: {
            file: 'dist/etcher.js',
            format: 'esm',
        },
    },
    {
        input: 'src/client/index.ts',
        plugins: [typescript()],
        output: {
            file: 'dist/client.js',
            format: 'esm',
        },
    },
    {
        input: 'src/module.ts',
        external: ['vite'],
        plugins: [
            typescript(),
            nodeResolve({
                exportConditions: ['node'],
            }),
            terser(),
        ],
        output: {
            file: 'dist/modetcher.js',
            format: 'esm',
        },
    },
]);
