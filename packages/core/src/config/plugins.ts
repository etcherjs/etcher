import type { Chunk, ExternalPluginOptions, PluginHookParams } from '../types';

import { HOOK_TYPES } from '../constants';
import { getConfig } from '.';
import chalk from 'chalk';

const Plugins: ExternalPluginOptions[] = [];

export const registerPlugins = async () => {
    const config = await getConfig();

    if (!config.plugins) return;

    for (let i = 0; i < config.plugins.length; i++) {
        Plugins.push(config.plugins[i]);
    }
};

export const runHooks = async (params: PluginHookParams) => {
    let finalValue = null;

    for (let i = 0; i < Plugins.length; i++) {
        const plugin = Plugins[i];

        try {
            if (plugin.hooks?.[params.hook]) {
                switch (params.hook) {
                    case HOOK_TYPES.PROCESS_COMPONENT:
                        finalValue =
                            (await plugin.hooks[HOOK_TYPES.PROCESS_COMPONENT](
                                finalValue || params.args[0],
                                ...(params.args.slice(1) as [string])
                            )) || null;

                        break;
                    case HOOK_TYPES.PROCESS_PAGE:
                        finalValue =
                            (await plugin.hooks[HOOK_TYPES.PROCESS_PAGE](
                                finalValue || params.args[0],
                                ...(params.args.slice(1) as [string])
                            )) || null;

                        break;
                    case HOOK_TYPES.PROCESS_CHUNK:
                        finalValue =
                            (await plugin.hooks[HOOK_TYPES.PROCESS_CHUNK](finalValue || params.args[0])) || null;

                        break;
                    case HOOK_TYPES.GENERATED_COMPONENT:
                        plugin.hooks[HOOK_TYPES.GENERATED_COMPONENT](...(params.args as [string, string]));
                        break;
                    case HOOK_TYPES.GENERATED_PAGE:
                        plugin.hooks[HOOK_TYPES.GENERATED_PAGE](...(params.args as [string, string]));
                        break;
                    case HOOK_TYPES.GENERATED_CHUNK:
                        plugin.hooks[HOOK_TYPES.GENERATED_CHUNK](...(params.args as [Chunk]));
                        break;
                }
            }
        } catch (e) {
            console.error(
                chalk.red(`Encountered error while running hook '${params.hook}' from plugin '${plugin.name}': ${e}`)
            );
        }
    }

    return finalValue;
};

export const getPlugins = () => Plugins;
