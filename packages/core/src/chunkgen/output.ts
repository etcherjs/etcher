import {
    processChunk,
    parseFile,
    done,
    resetChunks,
    clientJS,
    CHUNK_REGISTRY,
} from './index.js';
import { whitespace, log, error, divider } from '../util/logger.js';
import { isEtcherFile } from '../util/files.js';
import { runHooks } from '../config/plugins.js';
import { getConfig } from '../config/index.js';
import { HOOK_TYPES } from '../constants.js';
import { minify } from 'terser';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { dirname } from '../util/node.js';

export const generateCoreFile = async (shouldLog: boolean = true) => {
    try {
        if (shouldLog) log(chalk.white('Generating chunks...'));
        whitespace();

        const config = await getConfig();

        if (!fs.existsSync(config.input)) {
            throw new Error('Source directory does not exist!');
        }

        const componentFiles = await fs.promises.readdir(
            path.join(config.input, 'components')
        );

        for (const file of componentFiles) {
            if (isEtcherFile(file)) {
                log(chalk.cyanBright(`Transforming ${file}...`));

                const componentName = file.replace('.xtml', '');
                const componentData = await fs.promises.readFile(
                    path.join(config.input, 'components', file),
                    'utf8'
                );

                const PluginHookResult = await runHooks({
                    hook: HOOK_TYPES.PROCESS_COMPONENT,
                    args: [
                        componentData,
                        path.join(config.input, 'components', file),
                    ],
                });

                processChunk(componentName, PluginHookResult || componentData);

                runHooks({
                    hook: HOOK_TYPES.GENERATED_COMPONENT,
                    args: [
                        PluginHookResult || componentData,
                        path.join(config.input, 'components', file),
                    ],
                });

                log(chalk.greenBright(`Transformed ${file}!`));
            } else {
                log(
                    chalk.yellow(`Skipping ${file} as it is not an XTML file.`)
                );
            }
        }

        const waitFor = (condition: { (): boolean; (): any }) => {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (condition()) {
                        clearInterval(interval);
                        resolve(true);
                    }
                }, 100);
            });
        };

        await waitFor(() => done(componentFiles.length));

        if (!fs.existsSync(path.join(config.output))) {
            fs.mkdirSync(path.join(config.output));
        }

        whitespace();
        log(chalk.magenta('Finished generating chunks!'));

        return true;
    } catch (e) {
        error(`Error generating core file: `, e);
    }
};

const get = async (p: string) => {
    const entries = await fs.promises.readdir(p, { withFileTypes: true });

    const files = entries
        .filter((entry) => !entry.isDirectory())
        .map((file) => ({ ...file, path: path.join(p, file.name) }));

    const folders = entries.filter((entry) => entry.isDirectory());

    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];

        files.push(...(await get(path.join(p, folder.name, '/'))));
    }

    return files;
};

export const migratePages = async () => {
    try {
        log(chalk.white('Migrating pages...'));
        whitespace();
        const config = await getConfig();

        const files = await get(path.join(config.input, 'pages'));

        for (const file of files) {
            log(chalk.cyanBright(`Migrating ${file.path}`));

            let fileData = await fs.promises.readFile(file.path, 'utf8');

            const PluginHookResult = await runHooks({
                hook: HOOK_TYPES.PROCESS_PAGE,
                args: [`${fileData}`, file.path],
            });

            fileData = PluginHookResult || fileData;

            if (isEtcherFile(file.name)) {
                fileData = parseFile(
                    fileData.replace(
                        '</body>',
                        `<script type="module">
                        ${(await minify(clientJS)).code}
                        </script>
                        </body>`
                    )
                );

                CHUNK_REGISTRY.forEach((chunk) => {
                    if (!fileData.includes(chunk.chunkName)) return;

                    fileData = fileData.replace(
                        '</body>',
                        `<script type="module" src="/@etcher/${chunk.chunkName}.js"></script>
                        </body>`
                    );
                });
            }

            const computedAttributeRegex =
                /#[a-zA-Z0-9\-:]+\s*=\s*\{(?:\s*.*?\s*)\}\s*}?/gs;

            const computedAttributes = fileData.match(computedAttributeRegex);

            if (computedAttributes) {
                for (let i = 0; i < computedAttributes.length; i++) {
                    const attr = computedAttributes[i];

                    const attrName = attr.split('=')[0];

                    let attrValue = attr
                        .trim()
                        .split('=')[1]
                        .replace(/^\{/, '')
                        .replace(/\}$/, '')
                        .trim();

                    attrValue = attrValue.replaceAll('"', '&quot;');
                    attrValue = attrValue.replaceAll("'", '&apos;');
                    attrValue = attrValue.replaceAll('<', '&lt;');
                    attrValue = attrValue.replaceAll('>', '&gt;');
                    attrValue = attrValue.replaceAll('&', '&amp;');
                    attrValue = attrValue.replaceAll('`', '&grave;');

                    fileData = fileData.replace(
                        attr,
                        `${attrName}="${attrValue}" `
                    );
                }
            }

            const outputPath = path.join(
                config.output,
                file.path
                    .replace(path.join(config.input, 'pages'), '')
                    .replace('.xtml', '.html')
            );

            if (!fs.existsSync(path.dirname(outputPath))) {
                fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            }

            await fs.promises.writeFile(outputPath, fileData);

            if (!fs.existsSync(path.join(config.output, '@etcher'))) {
                fs.mkdirSync(path.join(config.output, '@etcher'));
            }

            runHooks({
                hook: HOOK_TYPES.GENERATED_PAGE,
                args: [fileData, file.path],
            });

            log(chalk.greenBright(`Migrated ${file.path}!`));
        }

        CHUNK_REGISTRY.forEach((chunk) => {
            fs.writeFileSync(
                path.join(config.output, `@etcher/${chunk.chunkName}.js`),
                `window.etcher.transform(\`${chunk.data}\`, '${chunk.chunkName}');`
            );
        });

        whitespace();
        log(chalk.magenta('Finished Migrating pages!'));
    } catch (e) {
        error(`Error migrating pages: `, e);
    }
};

let componentsDelay: string | number | NodeJS.Timeout;
let pagesDelay: string | number | NodeJS.Timeout;
let clientDelay: string | number | NodeJS.Timeout;
export const watch = async () => {
    const config = await getConfig();

    fs.watch(path.join(dirname(import.meta), 'client.js'), async () => {
        if (clientDelay) {
            return;
        }

        clientDelay = setTimeout(async () => {
            clearTimeout(clientDelay);
            clientDelay = null;
        }, 200);

        divider();

        log(
            chalk.magenta(
                'Detected change in client.js, regenerating chunks...'
            )
        );

        await migratePages();

        divider();
    });

    if (!fs.existsSync(config.input)) {
        throw new Error('Source directory does not exist!');
    }

    fs.watch(path.join(config.input, 'components'), async () => {
        if (componentsDelay) {
            return;
        }

        componentsDelay = setTimeout(async () => {
            clearTimeout(componentsDelay);
            componentsDelay = null;
        }, 200);

        whitespace();
        divider();
        log(
            chalk.white('Detected change in components, regenerating chunks...')
        );

        resetChunks();

        await generateCoreFile();
        await migratePages();

        divider();
    });

    fs.watch(path.join(config.input, 'pages'), async () => {
        if (pagesDelay) {
            return;
        }

        pagesDelay = setTimeout(async () => {
            clearTimeout(pagesDelay);
            pagesDelay = null;
        }, 200);

        whitespace();
        divider();
        log(chalk.white('Detected change in pages, regenerating pages...'));

        await migratePages();

        divider();
    });
};
