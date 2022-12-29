import { generateCoreFile, migratePages, watch } from './output';
import { registerPlugins } from './plugins';
import serve from './serve';
import chalk from 'chalk';

if (process.argv[1]) {
    registerPlugins();

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

    const args = process.argv.slice(2);

    if (args.includes('-s')) {
        console.log(chalk.magenta('Starting server...'));
        const server = await serve();

        server.printUrls();

        console.log('');
        console.log(
            '----------------------------------------------------------'
        );
        console.log('');
    }

    if (args.includes('-w')) {
        try {
            await generateCoreFile();
            await migratePages();

            watch();
        } catch (e) {
            console.log(e);
        }
    } else {
        try {
            await generateCoreFile();
            await migratePages();
        } catch (e) {
            console.log(e);
        }
    }
}
