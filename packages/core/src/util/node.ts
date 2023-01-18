export const runningInCLI = () => {
    return typeof process?.argv?.[1] === 'string';
};

export const filename = (meta: ImportMeta) => {
    return meta.url.replace('file://', '');
};

export const dirname = (meta: ImportMeta) => {
    return filename(meta).replace(/\/[^/]+$/, '');
};
