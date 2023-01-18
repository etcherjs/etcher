#!/usr/bin/env node

import { generateCoreFile, migratePages, watch } from './chunkgen/output';
import { divider, error, log, whitespace, wordmark } from './util/logger';
import { registerPlugins } from './config/plugins';
import { runningInCLI } from './util/node';
import serve from './util/serve';
import chalk from 'chalk';

if (runningInCLI()) {
    registerPlugins();

    wordmark();
    divider();
    whitespace();

    const args = process.argv.slice(2);

    if (args.includes('serve') || args.includes('-s')) {
        log(chalk.magenta('Starting server...'));

        const server = await serve();

        whitespace();
        server.printUrls();
        whitespace();
        divider();
    }

    if (args.includes('watch') || args.includes('-w')) {
        try {
            await generateCoreFile();
            await migratePages();

            watch();
        } catch (e) {
            error(e);
        }
    } else if (args.includes('build') || args.includes('-b')) {
        try {
            await generateCoreFile();
            await migratePages();
        } catch (e) {
            error(e);
        }
    } else if (args.includes('help') || args.includes('-h')) {
        log('etcher CLI');
        whitespace();
        log('Usage: etcher [command]');
        whitespace();
        log('Commands:');
        log('  serve, -s\tStarts the development server');
        log('  watch, -w\tBuild Files and watch for changes');
        log('  build, -b\tBuild Files');
        log('  help, -h\tShows this help message');

        process.exit(0);
    } else {
        log("etcher: No command specified. Try 'etcher help'");

        process.exit(1);
    }
}
