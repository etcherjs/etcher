export const runningInCLI = () => {
    return typeof process?.argv?.[1] === 'string';
};
