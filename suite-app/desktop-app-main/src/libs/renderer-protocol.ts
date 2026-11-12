import { app, net, protocol } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';

import { type Result, err, ok } from '@trezor/type-utils';

import type { ILogger } from './logger';

/**
 * The packaged renderer is served from `build/` over this scheme instead of being loaded from
 * `file://`. Chromium persists the V8 code cache of a page's scripts only for http(s) and for
 * schemes the embedder registers with `codeCache`; `file://` never gets one, so every launch
 * recompiled the whole renderer. The scheme is standard and secure, which gives the page a real
 * origin (`suite://app`) for its storage and for the CSP's `'self'`.
 */
export const RENDERER_SCHEME = 'suite';
export const RENDERER_HOST = 'app';
export const RENDERER_ORIGIN = `${RENDERER_SCHEME}://${RENDERER_HOST}`;
export const RENDERER_URL = `${RENDERER_ORIGIN}/index.html`;

/** Whether the URL is one the renderer protocol serves, so a page of the packaged renderer. */
export const isRendererUrl = (url: string | undefined) =>
    url?.startsWith(`${RENDERER_ORIGIN}/`) === true;

const SERVICE_NAME = 'renderer-protocol';

/**
 * Chromium accepts scheme privileges only before the app is ready, so this runs before
 * `app.whenReady()`.
 */
export const registerRendererScheme = () => {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: RENDERER_SCHEME,
            privileges: {
                standard: true,
                secure: true,
                supportFetchAPI: true,
                corsEnabled: true,
                codeCache: true,
            },
        },
    ]);
};

type ResolveRendererFileParams = {
    buildDir: string;
    url: string;
};

/**
 * Maps a renderer URL onto a file under the build directory. Any other origin, a malformed path
 * or a path that escapes the directory is refused.
 */
export const resolveRendererFile = ({
    buildDir,
    url,
}: ResolveRendererFileParams): Result<string, string> => {
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return err(`Malformed URL: ${url}`);
    }

    if (parsedUrl.protocol !== `${RENDERER_SCHEME}:` || parsedUrl.host !== RENDERER_HOST) {
        return err(`Unexpected origin: ${url}`);
    }

    let pathname: string;
    try {
        pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
        return err(`Malformed path: ${url}`);
    }

    const normalizedBuildDir = path.normalize(buildDir);
    const file = path.normalize(path.join(normalizedBuildDir, pathname));

    // A trailing separator means a directory was asked for, which is never a file to serve.
    if (!file.startsWith(normalizedBuildDir + path.sep) || file.endsWith(path.sep)) {
        return err(`Path escapes the build directory: ${url}`);
    }

    return ok(file);
};

type HandleRendererProtocolParams = {
    logger: ILogger;
};

/** Serves `build/` from the app directory, which is `app.asar` in a packaged build. */
export const handleRendererProtocol = ({ logger }: HandleRendererProtocolParams) => {
    const buildDir = path.join(app.getAppPath(), 'build');

    protocol.handle(RENDERER_SCHEME, async request => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response(null, { status: 405 });
        }

        const file = resolveRendererFile({ buildDir, url: request.url });
        if (!file.success) {
            logger.warn(SERVICE_NAME, file.error);

            return new Response(null, { status: 404 });
        }

        // Media elements request byte ranges; the file loader honours the header when it is passed on.
        const range = request.headers.get('range');

        try {
            return await net.fetch(pathToFileURL(file.payload).toString(), {
                method: request.method,
                headers: range ? { range } : {},
            });
        } catch (error) {
            logger.warn(SERVICE_NAME, `Cannot serve ${request.url}: ${error.message}`);

            return new Response(null, { status: 404 });
        }
    });

    logger.info(SERVICE_NAME, `Serving ${RENDERER_ORIGIN} from ${buildDir}`);
};
