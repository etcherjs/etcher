#!/usr/bin/env node

import { generateCoreFile, migratePages, watch } from './output.js';

switch (process.argv[2]) {
    case '-b':
        generateCoreFile()
            .catch(() => {
                process.exit(1);
            })
            .then(() => {
                migratePages();
            });
        break;
    case '-w':
        try {
            watch();
        } catch {
            process.exit(1);
        }

    default:
        generateCoreFile()
            .catch(() => {
                process.exit(1);
            })
            .then(() => {
                migratePages();
            });
}
