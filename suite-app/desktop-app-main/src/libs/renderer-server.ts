import { timingSafeEqual } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import * as http from 'http';
import type { AddressInfo } from 'net';
import path from 'path';

import { type Result, err, ok } from '@trezor/type-utils';

import type { ILogger } from './logger';

export const RENDERER_SERVER_HOST = 'localhost';
export const RENDERER_TOKEN_COOKIE = 'trezor-suite-renderer';

const SERVICE_NAME = 'renderer-server';

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.pdf': 'application/pdf',
};

type ResolveFilePathParams = {
    rootDir: string;
    urlPathname: string;
};

export const resolveFilePath = ({
    rootDir,
    urlPathname,
}: ResolveFilePathParams): string | undefined => {
    let decodedPathname: string;
    try {
        decodedPathname = decodeURIComponent(urlPathname);
    } catch {
        return undefined;
    }

    if (decodedPathname.includes('\0')) {
        return undefined;
    }

    const relativePath =
        decodedPathname === '/' ? 'index.html' : decodedPathname.replace(/^\/+/, '');
    const resolvedRootDir = path.resolve(rootDir);
    const filePath = path.resolve(resolvedRootDir, relativePath);

    if (!filePath.startsWith(resolvedRootDir + path.sep)) {
        return undefined;
    }

    return filePath;
};

const getCookieValue = (cookieHeader: string | undefined, name: string): string | undefined =>
    cookieHeader
        ?.split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${name}=`))
        ?.slice(name.length + 1);

const isTokenValid = (candidate: string | undefined, token: string): boolean => {
    if (candidate === undefined) {
        return false;
    }

    const candidateBuffer = Buffer.from(candidate);
    const tokenBuffer = Buffer.from(token);

    return (
        candidateBuffer.length === tokenBuffer.length &&
        timingSafeEqual(candidateBuffer, tokenBuffer)
    );
};

type ListenParams = {
    server: http.Server;
    address: string;
    port: number;
};

const listen = ({ server, address, port }: ListenParams) =>
    new Promise<Result<AddressInfo, NodeJS.ErrnoException>>(resolve => {
        const onError = (error: NodeJS.ErrnoException) => {
            resolve(err(error));
        };

        server.once('error', onError);
        server.listen(port, address, () => {
            server.off('error', onError);
            const addressInfo = server.address();
            if (!addressInfo || typeof addressInfo === 'string') {
                resolve(err(new Error(`Unexpected server address: ${addressInfo}`)));

                return;
            }
            resolve(ok(addressInfo));
        });
    });

const close = (server: http.Server) =>
    new Promise<void>(resolve => {
        server.closeAllConnections();
        server.close(() => resolve());
    });

export type RendererServer = {
    start: () => Promise<Result<string, string>>;
    stop: () => Promise<void>;
};

type CreateRendererServerParams = {
    rootDir: string;
    port: number;
    token: string;
    logger: ILogger;
};

export const createRendererServer = ({
    rootDir,
    port,
    token,
    logger,
}: CreateRendererServerParams): RendererServer => {
    let expectedHost: string | undefined;

    const sendStatus = (response: http.ServerResponse, status: number) => {
        response.writeHead(status, { 'Cache-Control': 'no-store' });
        response.end();
    };

    const handleRequest = async (request: http.IncomingMessage, response: http.ServerResponse) => {
        if (request.headers.host !== expectedHost) {
            logger.warn(
                SERVICE_NAME,
                `Rejected request for unexpected host ${request.headers.host}`,
            );
            sendStatus(response, 403);

            return;
        }

        if (!isTokenValid(getCookieValue(request.headers.cookie, RENDERER_TOKEN_COOKIE), token)) {
            logger.warn(SERVICE_NAME, `Rejected request without a valid token: ${request.url}`);
            sendStatus(response, 403);

            return;
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') {
            sendStatus(response, 405);

            return;
        }

        const { pathname } = new URL(request.url ?? '/', `http://${expectedHost}`);
        const filePath = resolveFilePath({ rootDir, urlPathname: pathname });
        if (filePath === undefined) {
            logger.warn(SERVICE_NAME, `Rejected request for path outside build: ${request.url}`);
            sendStatus(response, 403);

            return;
        }

        let size: number;
        try {
            const stats = await fs.stat(filePath);
            if (!stats.isFile()) {
                sendStatus(response, 404);

                return;
            }
            size = stats.size;
        } catch {
            sendStatus(response, 404);

            return;
        }

        response.writeHead(200, {
            'Content-Type': MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream',
            'Content-Length': size,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
        });

        if (request.method === 'HEAD') {
            response.end();

            return;
        }

        createReadStream(filePath)
            .on('error', error => {
                logger.error(SERVICE_NAME, `Failed to read ${filePath}: ${error.message}`);
                response.destroy();
            })
            .pipe(response);
    };

    const onRequest = (request: http.IncomingMessage, response: http.ServerResponse) => {
        handleRequest(request, response).catch(error => {
            logger.error(SERVICE_NAME, `Failed to handle ${request.url}: ${error.message}`);
            sendStatus(response, 500);
        });
    };

    const ipv4Server = http.createServer(onRequest);
    const ipv6Server = http.createServer(onRequest);

    const start = async (): Promise<Result<string, string>> => {
        const ipv4Result = await listen({ server: ipv4Server, address: '127.0.0.1', port });
        if (!ipv4Result.success) {
            return err(`Cannot listen on 127.0.0.1:${port}: ${ipv4Result.error.message}`);
        }
        const listeningPort = ipv4Result.payload.port;
        expectedHost = `${RENDERER_SERVER_HOST}:${listeningPort}`;

        const ipv6Result = await listen({
            server: ipv6Server,
            address: '::1',
            port: listeningPort,
        });
        if (!ipv6Result.success) {
            if (ipv6Result.error.code === 'EADDRINUSE') {
                await close(ipv4Server);

                return err(`Cannot listen on [::1]:${listeningPort}: ${ipv6Result.error.message}`);
            }
            logger.info(
                SERVICE_NAME,
                `Not listening on [::1]:${listeningPort}: ${ipv6Result.error.message}`,
            );
        }

        logger.info(SERVICE_NAME, `Serving ${rootDir} on http://${expectedHost}`);

        return ok(`http://${expectedHost}`);
    };

    const stop = async () => {
        await Promise.all([ipv4Server, ipv6Server].filter(server => server.listening).map(close));
        logger.info(SERVICE_NAME, 'Server stopped');
    };

    return { start, stop };
};
