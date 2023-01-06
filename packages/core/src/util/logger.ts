import chalk from 'chalk';

export const whitespace = () => {
    return console.log('');
};

export const divider = () => {
    return console.log(
        '----------------------------------------------------------'
    );
};

export const wordmark = () => {
    console.log(`
              .             oooo                           
            .o8             \`888                           
 .ooooo.  .o888oo  .ooooo.   888 .oo.    .ooooo.  oooo d8b 
d88' \`88b   888   d88' \`"Y8  888P"Y88b  d88' \`88b \`888""8P 
888ooo888   888   888        888   888  888ooo888  888     
888    .o   888 . 888   .o8  888   888  888    .o  888     
\`Y8bod8P'   "888" \`Y8bod8P' o888o o888o \`Y8bod8P' d888b    
`);
};

export const log = (...message: any[]) => {
    return console.log(...message);
};

export const error = (...message: any[]) => {
    return console.error(chalk.red(message[0]), ...message.slice(1));
};

export const warn = (...message: any[]) => {
    return console.warn(chalk.yellow(message[0]), ...message.slice(1));
};
