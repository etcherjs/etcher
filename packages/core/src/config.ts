import type { Options } from './types.js';
import path from 'path';

const templateConfig = {
    input: 'src',
    output: 'public',
};

let config: Options;

const importConfig: () => Promise<Options> = () => {
    return new Promise(async (resolve, reject) => {
        let configModule: { default: Options };
        try {
            configModule = await import(
                path.join(process.cwd(), 'etcher.config.js')
            );
        } catch (e) {
            resolve(templateConfig);
            return;
        }
        config = { ...templateConfig, ...configModule.default };
        resolve(config);
    }) as Promise<Options>;
};

export const getConfig = async () => {
    if (config) return config;
    return await importConfig();
};
