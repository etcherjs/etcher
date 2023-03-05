import type { Chunk } from '../types';

import { runHooks } from '../config/plugins';
import { HOOK_TYPES } from '../constants';
import { dirname } from '../util/node';
import crypto from 'crypto';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

export const clientJS = fs.readFileSync(path.join(dirname(import.meta), './client.js'), { encoding: 'utf8' });

export let chunks = [];

export const CHUNK_REGISTRY: Chunk[] = [];

let id = 0;

export const processChunk = async (name: string, data: string) => {
    try {
        id++;

        const suffix = crypto.createHash('SHA256').update(name).digest('hex').slice(0, 8);
        const chunkName = `etcher-${suffix}`;

        const chunk: Chunk = {
            id,
            name,
            chunkName,
            data: `${data}`,
        };

        const PluginHookResult = await runHooks({
            hook: HOOK_TYPES.PROCESS_CHUNK,
            args: [chunk],
        });

        CHUNK_REGISTRY.push(PluginHookResult || chunk);

        runHooks({
            hook: HOOK_TYPES.GENERATED_CHUNK,
            args: [PluginHookResult || chunk],
        });
    } catch (e) {
        console.error(chalk.red(`Error generating chunk: ${e}`));
    }
};

export const parseFile = (file: string) => {
    try {
        let fileData = file;

        for (const chunk of CHUNK_REGISTRY) {
            fileData = fileData.replaceAll(`etcher-${chunk.name}`, chunk.chunkName);
        }

        return fileData;
    } catch (e) {
        console.error(chalk.red(`Error parsing file: ${e}`));
    }
};

export const done = (expectedLength: number) => {
    return CHUNK_REGISTRY.length === expectedLength;
};

export const resetChunks = () => {
    CHUNK_REGISTRY.length = 0;
};
