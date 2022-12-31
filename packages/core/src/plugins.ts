import { Chunk, ExternalPluginOptions, PluginHookParams } from './types';
import { getConfig } from './config';
import chalk from 'chalk';

const Plugins: ExternalPluginOptions[] = [];

export const registerPlugins = async () => {
    const config = await getConfig();

    if (!config.plugins) return;

    for (let i = 0; i < config.plugins.length; i++) {
        Plugins.push(config.plugins[i]);
    }
};

export const runHooks = async (
    hook: PluginHookParams['hook'],
    ...args: PluginHookParams['args']
) => {
    let finalValue = null;

    for (let i = 0; i < Plugins.length; i++) {
        const plugin = Plugins[i];

        try {
            if (plugin.hooks?.[hook]) {
                switch (hook) {
                    case 'processComponent':
                    case 'processPage':
                        const res = await plugin.hooks[hook](
                            finalValue || args[0],
                            ...(args.slice(1) as [string, string])
                        );

                        if (res) finalValue = res;

                        break;
                    case 'generatedPage':
                        plugin.hooks[hook](...(args as [string, string]));
                        break;
                    case 'processChunk':
                        const chunk = await plugin.hooks[hook](
                            ...(args as [Chunk])
                        );

                        if (chunk) finalValue = chunk;

                        break;
                    case 'generatedChunk':
                        plugin.hooks[hook](...(args as [Chunk]));
                        break;
                }
            }
        } catch (e) {
            console.error(
                chalk.red(
                    `Encountered error while running hook '${hook}' from plugin '${plugin.name}': ${e}`
                )
            );
        }
    }

    return finalValue;
};

export const getPlugins = () => Plugins;
