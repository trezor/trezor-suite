/**
 * The development WARD Manager as an HTTP service: `DevWm` behind the API `HttpWm` speaks, with its
 * state persisted after every change. Run as its own process by `wmCli.ts`.
 *
 *   GET  /v1/info                       -> { pubkey }
 *   GET  /v1/wards/<wardId>/head        -> { head: { counter, root, headNonce } | null }
 *   POST /v1/wards/<wardId>/enrol       { root, headInitSig }
 *   POST /v1/wards/<wardId>/attest      { nonce }               -> attestation
 *   POST /v1/wards/<wardId>/advance     { fromCounter, fromRoot, toCounter, toRoot, wmSig }
 *                                       -> { revert }, or 409 { error: 'conflict', headCounter }
 *
 * The WM sees ward ids, counters, roots and signatures -- never an entry. It logs each decision.
 */
import { promises as fs } from 'fs';
import { type IncomingMessage, type ServerResponse, createServer } from 'http';
import type { AddressInfo } from 'net';
import path from 'path';

import {
    DevWm,
    type DevWmSnapshot,
    EMPTY_ROOT,
    WmConflict,
    attestationToJson,
    equalBytes,
    toBytes,
    toHex,
} from '@trezor/ward-core';

export const DEFAULT_WM_PORT = 21330;
const MAX_BODY = 4096;
const WM_FILE = 'wm.json';

export interface WmServerOptions {
    port: number;
    /** where the WM's state lives; null keeps it in memory */
    dataDir: string | null;
    log?: (line: string) => void;
    wm?: DevWm;
}

class HttpError extends Error {
    constructor(
        readonly status: number,
        message: string,
        readonly extra: Record<string, unknown> = {},
    ) {
        super(message);
    }
}

const short = (hex: string) => `${hex.slice(0, 8)}…`;
const shortRoot = (root: Uint8Array | null) =>
    !root || equalBytes(root, EMPTY_ROOT) ? 'empty' : short(toHex(root));

const hex32 = (value: unknown, field: string): Uint8Array => {
    if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) {
        throw new HttpError(400, `${field} must be 32 bytes of hex`);
    }

    return toBytes(value);
};
const rootField = (value: unknown, field: string) =>
    value === null || value === undefined ? null : hex32(value, field);
const counterField = (value: unknown, field: string) => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 0xffffffff) {
        throw new HttpError(400, `${field} must be an unsigned 32-bit integer`);
    }

    return value;
};
const sigField = (value: unknown, field: string) => {
    if (typeof value !== 'string' || !/^[0-9a-f]{128}$/i.test(value)) {
        throw new HttpError(400, `${field} must be a 64-byte signature in hex`);
    }

    return toBytes(value);
};

const readBody = (req: IncomingMessage) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
        let size = 0;
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BODY) {
                reject(new HttpError(413, 'body too large'));
                req.destroy();
            } else chunks.push(chunk);
        });
        req.on('end', () => {
            try {
                const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
                if (typeof body !== 'object' || body === null || Array.isArray(body)) {
                    throw new Error();
                }
                resolve(body);
            } catch {
                reject(new HttpError(400, 'body must be a JSON object'));
            }
        });
        req.on('error', reject);
    });

export const startWmServer = async (opts: WmServerOptions) => {
    const log = opts.log ?? (() => {});
    const wm = opts.wm ?? new DevWm();
    let persist = () => Promise.resolve();
    if (opts.dataDir !== null) {
        await fs.mkdir(opts.dataDir, { recursive: true, mode: 0o700 });
        const file = path.join(opts.dataDir, WM_FILE);
        try {
            wm.restore(JSON.parse(await fs.readFile(file, 'utf8')) as DevWmSnapshot);
            log(`[state] restored ${Object.keys(wm.snapshot().heads).length} ward(s) from ${file}`);
        } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        }
        // write-then-rename: a crash mid-write must not leave a WM that forgot its retired nonces
        persist = async () => {
            await fs.writeFile(`${file}.tmp`, JSON.stringify(wm.snapshot()), { mode: 0o600 });
            await fs.rename(`${file}.tmp`, file);
        };
    }
    // one change at a time, so a compare-and-swap and its persistence are not interleaved
    let queue: Promise<unknown> = Promise.resolve();
    const serial = <T>(fn: () => Promise<T>) => {
        const run = queue.then(fn, fn);
        queue = run.catch(() => {});

        return run;
    };

    const route = async (req: IncomingMessage): Promise<unknown> => {
        const url = new URL(req.url ?? '/', 'http://wm');
        if (req.method === 'GET' && url.pathname === '/v1/info') {
            return { pubkey: toHex(wm.pubkey) };
        }
        const match = /^\/v1\/wards\/([0-9a-fA-F]{64})\/(head|enrol|attest|advance)$/.exec(
            url.pathname,
        );
        if (!match) throw new HttpError(404, 'no such endpoint');
        const wardHex = match[1]!.toLowerCase();
        const wardId = toBytes(wardHex);
        const op = match[2]!;
        const ward = `ward=${short(wardHex)}`;

        if (op === 'head') {
            if (req.method !== 'GET') throw new HttpError(405, 'GET only');
            const h = wm.record(wardId);

            return {
                head: h
                    ? {
                          counter: h.counter,
                          root: equalBytes(h.root, EMPTY_ROOT) ? null : toHex(h.root),
                          headNonce: toHex(h.headNonce),
                      }
                    : null,
            };
        }
        if (req.method !== 'POST') throw new HttpError(405, 'POST only');
        const body = await readBody(req);

        if (op === 'attest') {
            const nonce = hex32(body.nonce, 'nonce');
            const att = await wm.attest(wardId, nonce).catch((e: Error) => {
                throw new HttpError(404, e.message);
            });
            log(
                `[attest] ${ward} head #${att.toCounter} root=${shortRoot(att.toRoot)}` +
                    ` for device nonce ${short(toHex(nonce))}`,
            );

            return attestationToJson(att);
        }

        return serial(async () => {
            if (op === 'enrol') {
                const root = rootField(body.root, 'root');
                const known = wm.record(wardId);
                await wm
                    .enrol(wardId, root, sigField(body.headInitSig, 'headInitSig'))
                    .catch((e: Error) => {
                        log(`[enrol] ${ward} REFUSED: ${e.message}`);
                        throw new HttpError(403, e.message);
                    });
                if (!known) {
                    await persist();
                    log(`[enrol] ${ward} enrolled at genesis root=${shortRoot(root)}`);
                }

                return {};
            }
            if ('timestamp' in body) {
                throw new HttpError(400, 'the WARD Manager assigns the acceptance timestamp');
            }

            const step = {
                wardId,
                fromCounter: counterField(body.fromCounter, 'fromCounter'),
                fromRoot: rootField(body.fromRoot, 'fromRoot'),
                toCounter: counterField(body.toCounter, 'toCounter'),
                toRoot: rootField(body.toRoot, 'toRoot'),
                wmSig: sigField(body.wmSig, 'wmSig'),
            };
            const what = `#${step.fromCounter} -> #${step.toCounter}`;
            try {
                const revert = await wm.advance(step);
                await persist();
                log(
                    `[advance] ${ward} ${what} ${revert ? 'REVERT ' : ''}accepted,` +
                        ` root=${shortRoot(step.toRoot)}, head nonce rotated`,
                );

                return { revert };
            } catch (e) {
                if (e instanceof WmConflict) {
                    log(`[advance] ${ward} ${what} CONFLICT: the head is at #${e.headCounter}`);
                    throw new HttpError(409, 'conflict', { headCounter: e.headCounter });
                }
                log(`[advance] ${ward} ${what} REFUSED: ${(e as Error).message}`);
                throw new HttpError(403, (e as Error).message);
            }
        });
    };

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        const reply = (status: number, body: unknown) => {
            res.writeHead(status, { 'content-type': 'application/json' });
            res.end(JSON.stringify(body));
        };
        route(req).then(
            body => reply(200, body),
            (e: unknown) => {
                if (e instanceof HttpError) {
                    reply(e.status, { error: e.message, ...e.extra });
                } else {
                    log(`[error] ${(e as Error)?.message ?? String(e)}`);
                    reply(500, { error: 'internal' });
                }
            },
        );
    });
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(opts.port, '127.0.0.1', () => resolve());
    });

    return {
        port: (server.address() as AddressInfo).port,
        wm,
        close: () =>
            new Promise<void>(resolve => {
                server.closeAllConnections();
                server.close(() => resolve());
            }),
    };
};
