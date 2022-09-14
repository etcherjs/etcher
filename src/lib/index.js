#!/usr/bin/env node

import { generateCoreFile, migratePages, watch } from "./output.js";

switch (process.argv[2]) {
    case "-b":
        generateCoreFile().then(() => {
            migratePages();
        });
        break;
    case "-w":
        watch();
    default:
        generateCoreFile().then(() => {
            migratePages();
        });
}
