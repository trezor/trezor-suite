import { app, net, protocol } from 'electron';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import type { ILogger } from './logger';
import { strictUrlSchema } from './strict-url';

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

/**
 * A URL of the renderer origin, parsed into a `URL`:
 * the renderer scheme and host, without a port or credentials.
 */
export const rendererUrlSchema = strictUrlSchema.refine(
    url =>
        url.protocol === `${RENDERER_SCHEME}:` &&
        url.host === RENDERER_HOST &&
        url.username === '' &&
        url.password === '',
    { message: 'Unexpected origin' },
);

/** Whether the URL is one the renderer protocol serves, so a page of the packaged renderer. */
export const isRendererUrl = (url: unknown) => rendererUrlSchema.safeParse(url).success;

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
    const parsedUrl = rendererUrlSchema.safeParse(url);
    if (!parsedUrl.success) {
        const [issue] = parsedUrl.error.issues;

        return err(`${issue?.message ?? 'Malformed URL'}: ${url}`);
    }

    let pathname: string;
    try {
        pathname = decodeURIComponent(parsedUrl.data.pathname);
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

const SINGLE_BYTE_RANGE = /^bytes=(\d*)-(\d*)$/;

type ByteRange =
    { type: 'whole' } | { type: 'partial'; start: number; end: number } | { type: 'unsatisfiable' };

type ResolveByteRangeParams = {
    range: string;
    size: number;
};

/**
 * Reads a `Range` header for a file of `size` bytes; `start` and `end` are inclusive.
 * A header that is not one valid byte range, such as several ranges or another unit,
 * asks for the whole file: RFC 9110 lets a server ignore it.
 */
export const resolveByteRange = ({ range, size }: ResolveByteRangeParams): ByteRange => {
    const match = SINGLE_BYTE_RANGE.exec(range.trim());
    const [, first = '', last = ''] = match ?? [];
    if (!match || (first === '' && last === '')) {
        return { type: 'whole' };
    }

    if (first === '') {
        const suffixLength = Number(last);
        if (suffixLength === 0 || size === 0) {
            return { type: 'unsatisfiable' };
        }

        return { type: 'partial', start: Math.max(size - suffixLength, 0), end: size - 1 };
    }

    const start = Number(first);
    const end = last === '' ? Infinity : Number(last);
    if (end < start) {
        return { type: 'whole' };
    }
    if (start >= size) {
        return { type: 'unsatisfiable' };
    }

    return { type: 'partial', start, end: Math.min(end, size - 1) };
};

type FetchRendererFileParams = {
    file: string;
    request: Request;
};

/**
 * Reads the file through the file loader, which also reads it inside `app.asar`.
 * The loader slices the body by a `Range` header but answers 200 without `Content-Range`,
 * so a media element seeking in it would read the slice as the start of the file.
 * The partial response is therefore built here.
 */
const fetchRendererFile = async ({ file, request }: FetchRendererFileParams) => {
    const fileUrl = pathToFileURL(file).toString();
    const range = request.headers.get('range');
    if (!range) {
        return net.fetch(fileUrl, { method: request.method });
    }

    const { size } = await fs.promises.stat(file);
    const byteRange = resolveByteRange({ range, size });
    switch (byteRange.type) {
        case 'whole':
            return net.fetch(fileUrl, { method: request.method });
        case 'unsatisfiable':
            return new Response(null, {
                status: 416,
                headers: { 'Content-Range': `bytes */${size}` },
            });
        case 'partial': {
            const { start, end } = byteRange;
            const response = await net.fetch(fileUrl, {
                method: request.method,
                headers: { range: `bytes=${start}-${end}` },
            });
            const headers = new Headers(response.headers);
            headers.set('Accept-Ranges', 'bytes');
            headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
            headers.set('Content-Length', String(end - start + 1));

            return new Response(response.body, { status: 206, headers });
        }
        default:
            return exhaustive(byteRange);
    }
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

        try {
            return await fetchRendererFile({ file: file.payload, request });
        } catch (error) {
            logger.warn(SERVICE_NAME, `Cannot serve ${request.url}: ${error.message}`);

            return new Response(null, { status: 404 });
        }
    });

    logger.info(SERVICE_NAME, `Serving ${RENDERER_ORIGIN} from ${buildDir}`);
};
