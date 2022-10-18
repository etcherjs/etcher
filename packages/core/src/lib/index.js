#!/usr/bin/env node

import { generateCoreFile, migratePages, watch } from './output.js';

console.log(`
              .             oooo                           
            .o8             \`888                           
 .ooooo.  .o888oo  .ooooo.   888 .oo.    .ooooo.  oooo d8b 
d88' \`88b   888   d88' \`"Y8  888P"Y88b  d88' \`88b \`888""8P 
888ooo888   888   888        888   888  888ooo888  888     
888    .o   888 . 888   .o8  888   888  888    .o  888     
\`Y8bod8P'   "888" \`Y8bod8P' o888o o888o \`Y8bod8P' d888b    
`);
console.log('----------------------------------------------------------');
console.log('');

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
