import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import { defineConfig } from 'rollup';

export default defineConfig({
    input: 'src/index.ts',
    external: ['vite'],
    plugins: [
        typescript(),
        nodeResolve({
            exportConditions: ['node'],
        }),
        terser(),
    ],
    output: {
        file: 'dist/etcher.js',
        format: 'esm',
    },
});
