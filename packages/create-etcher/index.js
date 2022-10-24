#!/usr/bin/env node

import prompts from 'prompts';
import path from 'path';
import fs from 'fs';
import { lightRed, lightYellow, green } from 'kolorist';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const isValidPackageName = (name) => {
    return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
        name
    );
};

const toValidPackageName = (name) => {
    return name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/^[._]/, '')
        .replace(/[^a-z0-9-~]+/g, '-');
};

let projectName = process.argv[2];

const copyDirectory = (source, destination, recursive) => {
    try {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }

        fs.readdirSync(source).forEach((file) => {
            try {
                const sourcePath = path.resolve(source, file);
                const destinationPath = path.resolve(destination, file);

                if (fs.lstatSync(sourcePath).isDirectory()) {
                    if (recursive) {
                        copyDirectory(sourcePath, destinationPath, recursive);
                    }
                } else {
                    try {
                        fs.copyFileSync(sourcePath, destinationPath);
                    } catch (error) {
                        console.log(error);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        });
    } catch (error) {
        console.log(error);
    }
};

const questions = [
    {
        type: 'text',
        name: 'name',
        message: 'Project name',
        initial: projectName || '',
        onState: (state) => {
            projectName = state.value;
        },
    },
    {
        type: () => (isValidPackageName(projectName) ? null : 'text'),
        name: 'packageName',
        message: 'Package name',
        initial: () => toValidPackageName(projectName),
        validate: (value) => {
            if (!isValidPackageName(value)) {
                return 'You must enter a valid package name.';
            }
            return true;
        },
    },
    {
        type: () => (fs.existsSync(projectName) ? 'confirm' : null),
        name: 'overwrite',
        message: () => {
            return `The directory '${projectName}' already exists. ${lightRed(
                'Do you want to overwrite it?'
            )}`;
        },
    },
    {
        type: (_, { overwrite }) => {
            if (overwrite === false) {
                throw new Error('Aborted');
            }
            fs.rmSync(projectName, { recursive: true, force: true });
            return null;
        },
        name: 'overwriteCheck',
    },
    {
        type: 'select',
        name: 'packageManager',
        message: 'Which package manager do you want to use?',
        choices: [
            { title: lightRed('npm'), value: 'npm' },
            { title: lightYellow('pnpm'), value: 'pnpm' },
        ],
    },
    {
        type: 'select',
        name: 'template',
        message: 'Which template do you want to use?',
        choices: [
            {
                title: 'Hello World',
                value: 'hello-world',
            },
        ],
    },
];

const createProject = async () => {
    const response = await prompts(questions);
    const { name, packageName, packageManager, template } = response;

    const projectPath = path.resolve(process.cwd(), name);

    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath);

        const packageJson = {
            name: packageName,
            description: '',
            version: '0.0.1',
            private: true,
            scripts: {
                dev: 'etcher -w',
                build: 'etcher -b',
            },
            dependencies: {
                '@etcherjs/etcher': '^2.0.0',
            },
        };

        fs.writeFileSync(
            path.resolve(projectPath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        const etcherConfig = `export default {\n  srcDir: 'src',\n  outDir: 'public'\n};`;

        fs.writeFileSync(
            path.resolve(projectPath, 'etcher.config.js'),
            etcherConfig
        );

        const readme = `# ${name}\n\n## Getting Started with \`etcher\`\n\nInstall dependencies:\n\n\`\`\`\n${packageManager} install\n\`\`\`\n\nStart etcher:\n\n\`\`\`\n${packageManager}${
            packageManager == 'npm' ? ' run' : ''
        } dev\n\`\`\`\n\nBuild for production:\n\n\`\`\`\n${packageManager} build\n\`\`\`\n`;

        fs.writeFileSync(path.resolve(projectPath, 'README.md'), readme);

        const templatePath = path.resolve(__dirname, 'templates', template);

        copyDirectory(templatePath, path.resolve(projectPath, 'src'), true);

        console.log('');
        console.log(green(`Your project has been created!`));
        console.log('');
        console.log(`To get started, run the following commands:`);
        console.log('');
        console.log(`  cd ${name}`);
        console.log(`  ${packageManager} install`);
        console.log(
            `  ${packageManager}${packageManager == 'npm' ? ' run' : ''} dev`
        );
        console.log('');
    }
};

createProject();
