export type EtcherOptions = {
    /**
     * The Input directory for Etcher to search for components and pages
     * @param {string} input
     */
    input?: string;
    /**
     * The Output directory for Etcher to deposit the generated files
     * @param {string} output
     */
    output?: string;
};

export const defineConfig: (options: EtcherOptions) => EtcherOptions;
