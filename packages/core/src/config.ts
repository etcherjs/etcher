import type { Config } from './types.js';
import path from 'path';

const templateConfig = {
    input: 'src',
    output: 'public',
};

let config: Config;

const importConfig: () => Promise<Config> = () => {
    return new Promise(async (resolve, reject) => {
        let configModule: { default: Config };
        try {
            configModule = await import(
                path.join(process.cwd(), 'etcher.config.js')
            );
        } catch (e) {
            resolve(templateConfig);
            return;
        }
        config = configModule.default;
        resolve(config);
    }) as Promise<Config>;
};

export const getConfig = async () => {
    if (config) return config;
    return await importConfig();
};
