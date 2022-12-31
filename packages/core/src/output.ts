import {
    chunks,
    processChunk,
    parseFile,
    done,
    resetChunks,
} from './chunkgen.js';
import { getConfig } from './config.js';
import { runHooks } from './plugins.js';
import { minify } from 'terser';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

export const generateCoreFile = async (log: boolean = true) => {
    try {
        if (log) console.log(chalk.white('Generating chisel...'));
        console.log('');

        const config = await getConfig();

        if (!fs.existsSync(config.input)) {
            throw new Error('Source directory does not exist!');
        }

        const componentFiles = await fs.promises.readdir(
            path.join(config.input, 'components')
        );

        for (const file of componentFiles) {
            if (file.endsWith('.xtml')) {
                console.log(chalk.cyanBright(`Transforming ${file}...`));

                const componentName = file.replace('.xtml', '');
                const componentData = await fs.promises.readFile(
                    path.join(config.input, 'components', file),
                    'utf8'
                );

                const PluginHookResult = await runHooks(
                    'processComponent',
                    `${componentData}`,
                    file,
                    path.join(config.input, 'components', file)
                );

                processChunk(componentName, PluginHookResult || componentData);

                runHooks(
                    'generatedComponent',
                    `${componentData}`,
                    path.join(config.input, 'components', file)
                );

                console.log(chalk.greenBright(`Transformed ${file}!`));
            } else {
                console.log(
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

        await fs.promises.writeFile(
            path.join(config.output, '_chisel.js'),
            (
                await minify(chunks)
            ).code
        );

        console.log('');
        console.log(chalk.magenta('Finished Generating chisel!'));

        return true;
    } catch (e) {
        console.error(chalk.red(`Error generating core file: ${e}`));
    }
};

export const migratePages = async () => {
    try {
        console.log(chalk.white('Migrating pages...'));
        console.log('');
        const config = await getConfig();

        const pages = await fs.promises.readdir(
            path.join(config.input, 'pages')
        );

        for (const page of pages) {
            console.log(chalk.cyanBright(`Migrating ${page}...`));

            let pageData = await fs.promises.readFile(
                path.join(config.input, 'pages', page),
                'utf8'
            );

            const PluginHookResult = await runHooks(
                'processPage',
                `${pageData}`,
                page,
                path.join(config.input, 'pages', page)
            );

            pageData = PluginHookResult || pageData;

            // meh... it's a replacement for a DOMParser but it can be improved
            if (page.includes('.xtml')) {
                pageData = parseFile(
                    pageData.replace(
                        '</body>',
                        `<script src="/_chisel.js"></script></body>`
                    )
                );
            }

            const computedAttributeRegex =
                /#[a-zA-Z0-9\-:]+\s*=\s*\{(?:\s*.*?\s*)\}\s*}?/gs;

            const computedAttributes = pageData.match(computedAttributeRegex);

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

                    pageData = pageData.replace(
                        attr,
                        `${attrName}="${attrValue}"`
                    );
                }
            }

            await fs.promises.writeFile(
                path.join(config.output, page.replace('.xtml', '.html')),
                pageData
            );

            runHooks(
                'generatedPage',
                `${pageData}`,
                path.join(config.output, page)
            );

            console.log(chalk.greenBright(`Migrated ${page}!`));
        }

        console.log('');
        console.log(chalk.magenta('Finished Migrating pages!'));
    } catch (e) {
        console.error(chalk.red(`Error migrating pages: ${e}`));
    }
};

let delay;
let otherDelay;
export const watch = async () => {
    const config = await getConfig();

    if (!fs.existsSync(config.input)) {
        throw new Error('Source directory does not exist!');
    }

    fs.watch(path.join(config.input, 'components'), async () => {
        if (delay) {
            return;
        }
        delay = setTimeout(async () => {
            clearTimeout(delay);
            delay = null;
        }, 200);

        console.log('');
        console.log('---------------------------------------------');
        console.log(
            chalk.white('Detected change in components, regenerating chisel...')
        );

        resetChunks();
        await generateCoreFile();
        await migratePages();

        console.log('---------------------------------------------');
    });

    fs.watch(path.join(config.input, 'pages'), async () => {
        if (otherDelay) {
            return;
        }
        otherDelay = setTimeout(async () => {
            clearTimeout(otherDelay);
            otherDelay = null;
        }, 200);
        console.log('');
        console.log('---------------------------------------------');
        console.log(
            chalk.white('Detected change in pages, regenerating pages...')
        );
        await migratePages();
        console.log('---------------------------------------------');
    });
};
