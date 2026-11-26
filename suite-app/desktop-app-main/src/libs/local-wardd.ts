import path from 'path';
import { WebSocket } from 'ws';

import { type Result, err, ok } from '@trezor/type-utils';
import type { WardRelay } from '@trezor/ward';
import { WARDD_DEFAULT_URL, WarddClient } from '@trezor/wardd/src/client';

type LocalWarddEnv = {
    /** The port a standalone wardd was started with (wardd reads the same variable). */
    WARDD_PORT?: string;
    /** wardd's token file, when wardd was started with a `--data-dir` other than the default. */
    WARDD_TOKEN_FILE?: string;
};

export type CreateLocalWarddParams = {
    env: LocalWarddEnv;
    homeDir: string;
    readFile: (file: string) => Promise<string>;
};

const getLocalWarddUrl = (port: string | undefined) =>
    port && /^\d{1,5}$/.test(port) ? `ws://127.0.0.1:${port}` : WARDD_DEFAULT_URL;

const readToken = async ({
    env,
    homeDir,
    readFile,
}: CreateLocalWarddParams): Promise<Result<string, string>> => {
    const tokenFile = env.WARDD_TOKEN_FILE ?? path.join(homeDir, '.trezor-ward', 'token');

    try {
        return ok((await readFile(tokenFile)).trim());
    } catch (error) {
        // The message reaches the renderer, so it names neither the path nor the OS error.
        return err(
            error?.code === 'ENOENT'
                ? 'wardd is not set up on this computer'
                : 'wardd token could not be read',
        );
    }
};

/**
 * The standalone wardd on this computer, for the main-process Connect. Nothing is read or opened
 * until a WARD method or a contact payment calls `connect()`, so a computer without wardd's token
 * simply has no wardd: WARD methods fail, and contact signing goes ahead with bare addresses.
 */
export const createLocalWardd = (params: CreateLocalWarddParams): WardRelay => ({
    connect: async (signal?: AbortSignal) => {
        const token = await readToken(params);
        if (!token.success) {
            throw new Error(token.error);
        }

        return new WarddClient({
            url: getLocalWarddUrl(params.env.WARDD_PORT),
            token: token.payload,
            // With Tor on, the patched global WebSocket would route even 127.0.0.1 through Tor.
            // `ws` implements the WHATWG members the client uses, but its type is its own.
            WebSocket: WebSocket as unknown as typeof globalThis.WebSocket,
        }).connect(signal);
    },
});
