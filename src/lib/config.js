const templateConfig = {
    srcDir: 'src',
    outDir: 'public',
};

let config;

const importConfig = () => {
    return new Promise(async (resolve, reject) => {
        let configModule;
        try {
            configModule = await import('../../etcher.config.js');
        } catch (e) {
            resolve(templateConfig);
            return;
        }
        config = configModule.default;
        resolve(config);
    });
};

export const getConfig = async () => {
    if (config) return config;
    return await importConfig();
};
