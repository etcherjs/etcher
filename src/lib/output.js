import { getConfig } from './config.js';
import { minify } from 'terser';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export const generateCoreFile = async () => {
    console.log(chalk.white('Generating chisel...'));
    console.log('');

    const config = await getConfig();

    const componentFiles = await fs.promises.readdir(
        path.join(config.srcDir, 'components')
    );

    let toWrite = `const transformComponent=(doc,name)=>{const parsed=new DOMParser().parseFromString(doc,"text/html");class customElement extends HTMLElement{constructor(){super();const shadow=this.attachShadow({mode:"open"});shadow.append(...parsed.body.children)}}const normalisedName=name.replace(/([a-z])([A-Z])/g,"$1-$2").replace(/\\s+/g,"-").toLowerCase();window.customElements.define(normalisedName,customElement)};`;

    for (const file of componentFiles) {
        if (file.endsWith('.html')) {
            console.log(chalk.cyanBright(`Transforming ${file}...`));

            const componentName = file.replace('.html', '');
            const componentData = await fs.promises.readFile(
                path.join(config.srcDir, 'components', file),
                'utf8'
            );

            toWrite += `{const doc=\`${componentData}\`;transformComponent(doc,"${componentName}");}`;

            console.log(chalk.greenBright(`Transformed ${file}!`));
        } else {
            console.log(
                chalk.yellow(`Skipping ${file} as it is not an HTML file.`)
            );
        }
    }

    if (!fs.existsSync(path.join(config.outDir))) {
        fs.mkdirSync(path.join(config.outDir));
    }

    await fs.promises.writeFile(
        path.join(config.outDir, '_chisel.js'),
        (
            await minify(toWrite)
        ).code
    );

    console.log('');
    console.log(chalk.magenta('Finished Generating chisel!'));
};

export const migratePages = async () => {
    console.log(chalk.white('Migrating pages...'));
    console.log('');
    const config = await getConfig();

    const pages = await fs.promises.readdir(path.join(config.srcDir, 'pages'));

    for (const page of pages) {
        console.log(chalk.cyanBright(`Migrating ${page}...`));

        let pageData = await fs.promises.readFile(
            path.join(config.srcDir, 'pages', page),
            'utf8'
        );

        // meh... it's a replacement for a DOMParser but it can be improved
        pageData = pageData.replace(
            '</body>',
            `<script src="/_chisel.js"></script></body>`
        );

        await fs.promises.writeFile(path.join(config.outDir, page), pageData);

        console.log(chalk.greenBright(`Migrated ${page}!`));
    }

    console.log('');
    console.log(chalk.magenta('Finished Migrating pages!'));
};

let delay;
let otherDelay;
export const watch = async () => {
    const config = await getConfig();

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
        await generateCoreFile();
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
