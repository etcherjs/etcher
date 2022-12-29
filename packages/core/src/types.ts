export type Chunk = {
    id: number;
    name: string;
    chunkName: string;
    data: string;
};

export type ExternalPluginOptions = {
    name: string;
    hooks: {
        processComponent?: (
            code: string,
            fileName: string,
            path: string
        ) => (string | null) | Promise<string | null>;
        processPage?: (
            code: string,
            fileName: string,
            path: string
        ) => (string | null) | Promise<string | null>;
        processChunk?: (chunk: Chunk) => (Chunk | null) | Promise<Chunk | null>;

        generatedComponent?: (code: string, path: string) => void;
        generatedPage?: (code: string, path: string) => void;
        generatedChunk?: (chunk: Chunk) => void;
    };
};

export type PluginHookParams =
    | {
          hook: 'processComponent';
          args: [string, string, string];
      }
    | {
          hook: 'processPage';
          args: [string, string, string];
      }
    | {
          hook: 'processChunk';
          args: [Chunk];
      }
    | {
          hook: 'generatedComponent';
          args: [string, string];
      }
    | {
          hook: 'generatedPage';
          args: [string, string];
      }
    | {
          hook: 'generatedChunk';
          args: [Chunk];
      };

export type Options = {
    input?: string;
    output?: string;
    plugins?: ExternalPluginOptions[];
};
