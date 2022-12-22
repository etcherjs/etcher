import { createServer } from 'vite';
import { getConfig } from './config';
import path from 'path';

const config = await getConfig();

export default async () => {
    const server = await createServer({
        root: path.join(process.cwd(), config.output),
        server: {
            port: 3000,
        },
    });

    await server.listen();

    return server;
};
