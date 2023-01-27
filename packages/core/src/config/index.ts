import type { Options } from '../types';

import { warn } from '../util/logger';
import path from 'path';

const templateConfig = {
    input: 'src',
    output: 'public',
    plugins: [],
};

let config: Options;

const _importConfig: () => Promise<Options> = () => {
    return new Promise(async (resolve, reject) => {
        let configModule: { default: Partial<Options> };
        try {
            configModule = await import(path.join(process.cwd(), 'etcher.config.js'));
        } catch (e) {
            warn("Error while importing 'etcher.config.js'. Using default config.");
            resolve(templateConfig);
            return;
        }
        config = { ...templateConfig, ...configModule.default };
        resolve(config);
    }) as Promise<Options>;
};

export const getConfig = async () => {
    if (config) return config;
    return await _importConfig();
};
