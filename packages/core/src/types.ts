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
            path: string
        ) => (string | null) | Promise<string | null>;
        processPage?: (
            code: string,
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
          hook: 'processComponent' | string;
          args: [string, string];
      }
    | {
          hook: 'processPage' | string;
          args: [string, string];
      }
    | {
          hook: 'processChunk' | string;
          args: [Chunk];
      }
    | {
          hook: 'generatedComponent' | string;
          args: [string, string];
      }
    | {
          hook: 'generatedPage' | string;
          args: [string, string];
      }
    | {
          hook: 'generatedChunk' | string;
          args: [Chunk];
      };

export type Options = {
    input?: string;
    output?: string;
    plugins?: ExternalPluginOptions[];
    batteryMode?: boolean;
};
