import * as path from 'path';
import * as fs from 'fs';

const findConfig = (
    path: string
): {
    path: string;
    rootPath: string;
} | null => {
    if (!path) throw new Error('No path provided');

    const testPath = path + '/etcher.config.js';

    if (fs.existsSync(testPath)) {
        return {
            path: testPath,
            rootPath: path,
        };
    }

    if (path === '/') {
        return null;
    }

    return findConfig(path.substring(0, path.lastIndexOf('/')));
};

const closestPackage = (path: string): string | null => {
    const testPath = path + '/package.json';

    if (fs.existsSync(testPath)) {
        return path;
    }

    if (path === '/') {
        return null;
    }

    return closestPackage(path.substring(0, path.lastIndexOf('/')));
};

export const retrieveConfig = (uri: string) => {
    const path_uri = uri.replace('file://', '');

    const config = findConfig(path_uri);

    let configObj: null | {
        input?: string;
        output?: string;
    } = null;

    if (config) {
        const data = fs.readFileSync(config.path, 'utf8').replace(/plugins:\s*\[.*?],/s, '');

        const exported = data.match(/export\s+default\s+(?:defineConfig\()?({[\s\S]*})\)?/);

        configObj = exported
            ? JSON.parse(
                  exported[1]
                      .replace(/(\w+):/g, '"$1":')
                      .replace(/'/g, '"')
                      .replace(/,\s*}/g, '}')
              )
            : {
                  input: 'src',
                  output: 'public',
              };
    }

    if (!configObj) {
        configObj = {
            input: 'src',
            output: 'public',
        };
    }

    const componentsDir = path.join(
        config?.rootPath || closestPackage(path_uri) || '',
        configObj?.input || 'src',
        'components'
    );
    const pagesDir = path.join(config?.rootPath || closestPackage(path_uri) || '', configObj?.input || 'src', 'pages');

    return {
        componentsDir,
        pagesDir,
        raw: configObj,
    };
};
