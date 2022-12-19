import {
    chunks,
    generateChunk,
    parseFile,
    done,
    resetChunks,
} from './chunkgen.js';
import { getConfig } from './config.js';
import { minify } from 'terser';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export const generateCoreFile = async (n) => {
    try {
        if (!n) console.log(chalk.white('Generating chisel...'));
        console.log('');

        const config = await getConfig();

        if (!fs.existsSync(config.srcDir)) {
            console.log(
                chalk.red('Source directory does not exist! Aborting...')
            );

            throw new Error('Source directory does not exist!');
        }

        const componentFiles = await fs.promises
            .readdir(path.join(config.srcDir, 'components'))
            .catch(() => {
                console.log(
                    chalk.red('Error reading component directory! Aborting...')
                );
            });

        for (const file of componentFiles) {
            if (file.endsWith('.xtml')) {
                console.log(chalk.cyanBright(`Transforming ${file}...`));

                const componentName = file.replace('.xtml', '');
                const componentData = await fs.promises.readFile(
                    path.join(config.srcDir, 'components', file),
                    'utf8'
                );

                generateChunk(componentName, componentData);

                console.log(chalk.greenBright(`Transformed ${file}!`));
            } else {
                console.log(
                    chalk.yellow(`Skipping ${file} as it is not an XTML file.`)
                );
            }
        }

        const waitFor = (condition) => {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    if (condition()) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
        };

        await waitFor(() => done(componentFiles.length));

        if (!fs.existsSync(path.join(config.outDir))) {
            fs.mkdirSync(path.join(config.outDir));
        }

        await fs.promises.writeFile(
            path.join(config.outDir, '_chisel.js'),
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
            path.join(config.srcDir, 'pages')
        );

        for (const page of pages) {
            console.log(chalk.cyanBright(`Migrating ${page}...`));

            let pageData = await fs.promises.readFile(
                path.join(config.srcDir, 'pages', page),
                'utf8'
            );

            // meh... it's a replacement for a DOMParser but it can be improved
            pageData = parseFile(
                pageData.replace(
                    '</body>',
                    `<script src="/_chisel.js"></script></body>`
                )
            );

            await fs.promises.writeFile(
                path.join(config.outDir, page.replace('.xtml', '.html')),
                pageData
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

    if (!fs.existsSync(config.srcDir)) {
        console.log(chalk.red('Source directory does not exist! Aborting...'));

        throw new Error('Source directory does not exist!');
    }

    fs.watch(path.join(config.srcDir, 'components'), async () => {
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
        await generateCoreFile(true);
        await migratePages();

        console.log('---------------------------------------------');
    });

    fs.watch(path.join(config.srcDir, 'pages'), async () => {
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
