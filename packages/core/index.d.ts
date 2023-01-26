export type Chunk = {
    id: number;
    name: string;
    chunkName: string;
    data: string;
};

export type ExternalPluginOptions = {
    name: string;
    hooks: {
        processComponent?: (code: string, path: string) => (string | null) | Promise<string | null>;
        processPage?: (code: string, path: string) => (string | null) | Promise<string | null>;
        processChunk?: (chunk: Chunk) => (Chunk | null) | Promise<Chunk | null>;
        generatedComponent?: (code: string, path: string) => void;
        generatedPage?: (code: string, path: string) => void;
        generatedChunk?: (chunk: Chunk) => void;
    };
};

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
    /**
     * An array of plugins for Etcher to use during the generation process
     * @param {ExternalPluginOptions[]} plugins
     */
    plugins?: ExternalPluginOptions[];
};

export const defineConfig: (options: EtcherOptions) => EtcherOptions;
