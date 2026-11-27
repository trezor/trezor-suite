/**
 * The relay endpoint: `relay.md` over a WebSocket on 127.0.0.1.
 *
 * TWO GATES. A browser page can open a socket to localhost, so an Origin header -- which only a
 * browser sends, and which page script cannot forge -- must be on the allow-list, as for Trezor
 * Bridge. And EVERY client must present the pairing token in `hello` before anything else, which
 * is what keeps out another local process or an allowed origin's page without the token.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { type AddressInfo } from 'net';
import { WebSocket, WebSocketServer } from 'ws';

import {
    type ClientFrame,
    RELAY_PROTOCOL_VERSION,
    type RelayCall,
    type RelayErrorCode,
    type RelayMessage,
    type WarddFrame,
} from '@trezor/ward-core';

import {
    adversarialCatchUpToOlderHead,
    adversarialServeEntry,
    isAdversarialMethod,
} from './adversarial';
import { type Device, RelayFailure, type WardHost } from './host';
import { type Wardd } from './service';

export const DEFAULT_PORT = 21329;
const DEVICE_REPLY_TIMEOUT_MS = 120_000;
const CONVERSATION_TIMEOUT_MS = 900_000;

export const DEFAULT_ORIGINS = [
    'https://suite.trezor.io',
    'https://connect.trezor.io',
    'http://localhost:8000',
    'http://localhost:8088',
];

export interface ServerOptions {
    wardd: Wardd;
    token: string;
    port?: number;
    allowedOrigins?: readonly string[];
    deviceReplyTimeoutMs?: number;
    /**
     * One line per exchange: the call, its outcome, and every device message by NAME. Payloads,
     * values and the token are never logged; keys and roots are shortened.
     */
    log?: (line: string) => void;
    /**
     * Allow the ADVERSARIAL TEST methods (`adversarial*`): a hostile host serving the device an
     * older state, which the device must refuse. Never on in normal use (`--adversarial-tests`).
     */
    adversarialTests?: boolean;
}

const short = (hex: unknown) => (typeof hex === 'string' && hex ? `${hex.slice(0, 12)}…` : '-');

/** What a call is about, in a few words: the path for a pull, the wallet for a store. */
const describeCall = (call: RelayCall): string => {
    const p = (call.params ?? {}) as Record<string, any>;
    if (call.method === 'serveEntry') {
        const staged = p.staged?.length ? ` staged=${p.staged.length}` : '';

        return ` entry=${short(p.request?.entry_key)}${staged}`;
    }
    if (call.method === 'openStore') return ` ward=${short(p.wardId)}`;

    return '';
};

const outcome = (method: string, result: Record<string, unknown>): string => {
    if (method === 'serveEntry') {
        return result.sealed_content ? 'present' : 'absent';
    }
    const parts = [];
    if ('counter' in result) parts.push(`counter=${String(result.counter)}`);
    if ('root' in result) parts.push(`root=${short(result.root)}`);
    if ('remaining' in result) parts.push(`remaining=${String(result.remaining)}`);
    if (result.wmAvailable === false) parts.push('(WM unavailable)');

    return parts.join(' ') || 'ok';
};

const digest = (s: string) => createHash('sha256').update(s).digest();
const tokenMatches = (given: unknown, token: string) =>
    typeof given === 'string' && timingSafeEqual(digest(given), digest(token));
const major = (v: string) => v.split('.')[0];

export const startServer = async (opts: ServerOptions) => {
    const log = opts.log ?? (() => {});
    let connections = 0;
    const allowed = new Set(opts.allowedOrigins ?? DEFAULT_ORIGINS);
    const wss = new WebSocketServer({
        host: '127.0.0.1',
        port: opts.port ?? DEFAULT_PORT,
        verifyClient: ({ origin }: { origin?: string }) => !origin || allowed.has(origin),
    });
    await new Promise<void>((resolve, reject) => {
        wss.once('listening', resolve);
        wss.once('error', reject);
    });

    wss.on('connection', socket => {
        const conn = ++connections;
        log(`[${conn}] connected`);
        let authed = false;
        let host: WardHost | null = null;
        const pending = new Map<
            number,
            {
                resolve: (reply: RelayMessage) => void;
                reject: (e: Error) => void;
                timer: ReturnType<typeof setTimeout>;
            }
        >();
        const active = new Set<number>();
        const send = (frame: WarddFrame) => {
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(frame));
        };
        const fail = (id: number, code: RelayErrorCode, message: string) =>
            send({ id, error: { code, message } });

        const takePending = (id: number) => {
            const waiting = pending.get(id);
            if (waiting) {
                clearTimeout(waiting.timer);
                pending.delete(id);
            }

            return waiting;
        };

        const cancelPending = (reason: string) => {
            for (const id of pending.keys()) {
                takePending(id)?.reject(new RelayFailure('device_failure', reason));
            }
        };

        socket.on('close', () => {
            log(`[${conn}] closed`);
            cancelPending('the client went away');
        });
        socket.on('error', () => {
            socket.terminate();
            cancelPending('the client connection failed');
        });

        const handle = async (call: RelayCall): Promise<Record<string, unknown>> => {
            const p = (call.params ?? {}) as Record<string, any>;
            if (call.method === 'hello') {
                if (
                    typeof p.version !== 'string' ||
                    major(p.version) !== major(RELAY_PROTOCOL_VERSION)
                ) {
                    throw new RelayFailure(
                        'version_mismatch',
                        `wardd speaks ${RELAY_PROTOCOL_VERSION}`,
                    );
                }
                if (!tokenMatches(p.token, opts.token)) {
                    throw new RelayFailure('unauthorised', 'wrong pairing token');
                }
                authed = true;

                return { version: RELAY_PROTOCOL_VERSION, wardd: 'wardd/1.0.0' };
            }
            if (!authed) throw new RelayFailure('unauthorised', 'hello first');
            if (call.method === 'openStore') {
                if (typeof p.wardId !== 'string') throw new RelayFailure('bad_request', 'wardId');
                if ('evoluNode' in p) {
                    throw new RelayFailure(
                        'bad_request',
                        'openStore requires the WARD owner secret',
                    );
                }
                if (
                    p.wardOwnerSecret !== undefined &&
                    (typeof p.wardOwnerSecret !== 'string' ||
                        !/^[\da-f]{64}$/i.test(p.wardOwnerSecret))
                ) {
                    throw new RelayFailure('bad_request', 'invalid WARD owner secret');
                }
                host = await opts.wardd.openStore({
                    wardId: p.wardId,
                    wardOwnerSecret: p.wardOwnerSecret,
                });
                const { counter, root, wmAvailable } = await host.status();

                return { counter, root, wmAvailable };
            }
            if (!host) throw new RelayFailure('no_store', 'openStore first');
            let deadline: number | undefined;
            const device: Device = message =>
                new Promise((resolve, reject) => {
                    if (socket.readyState !== WebSocket.OPEN) {
                        reject(new RelayFailure('device_failure', 'the client went away'));

                        return;
                    }
                    const now = performance.now();
                    deadline ??= now + CONVERSATION_TIMEOUT_MS;
                    const timeout = Math.min(
                        opts.deviceReplyTimeoutMs ?? DEVICE_REPLY_TIMEOUT_MS,
                        deadline - now,
                    );
                    const expire = () => {
                        const reason = 'timed out waiting for the client device';
                        takePending(call.id);
                        reject(new RelayFailure('device_failure', reason));
                        fail(call.id, 'device_failure', reason);
                        // Reconnect so that a late reply cannot answer a later conversation.
                        socket.close(1008, reason);
                        cancelPending(reason);
                    };
                    if (timeout <= 0) {
                        expire();

                        return;
                    }
                    pending.set(call.id, {
                        resolve: reply => {
                            log(`[${conn}] #${call.id}   <- ${reply.name}`);
                            resolve(reply);
                        },
                        reject,
                        timer: setTimeout(expire, timeout),
                    });
                    log(`[${conn}] #${call.id}   -> ${message.name}`);
                    send({ id: call.id, deviceCall: message });
                });
            // ===================================================================================
            //   ADVERSARIAL TESTS -- a hostile host, on purpose; see adversarial.ts. Refused
            //   unless this wardd was started with `--adversarial-tests`.
            // ===================================================================================
            if (isAdversarialMethod(call.method)) {
                if (!opts.adversarialTests) {
                    throw new RelayFailure(
                        'bad_request',
                        'adversarial tests are off; start wardd with --adversarial-tests',
                    );
                }
                const counter = Number(p.counter);
                if (call.method === 'adversarialCatchUpToOlderHead') {
                    return { ...(await adversarialCatchUpToOlderHead(host, device, counter, log)) };
                }

                return { ...(await adversarialServeEntry(host, p.request ?? {}, counter, log)) };
            }

            switch (call.method) {
                case 'serveEntry':
                    return { ...(await host.serveEntry(p.request ?? {}, p.staged ?? [])) };
                case 'applyResult': {
                    // `sync`: the caller relays the device, so sync it at once. The device signed
                    // a step the WM has now accepted, and it treats its head as unconfirmed until a
                    // sync adopts it; syncing here closes that window in normal use.
                    const { sync, ...result } = p;
                    const applied = await host.applyResult(result);
                    if (!sync || !applied.published) return applied;

                    return { ...applied, synced: { ...(await host.sync(device)) } };
                }
                case 'sync':
                    return { ...(await host.sync(device, { rejoin: !!p.rejoin })) };
                case 'recoveryTargets':
                    return { targets: await host.recoveryTargets() };
                case 'revert':
                    if (
                        typeof p.counter !== 'number' ||
                        (p.root !== null && typeof p.root !== 'string')
                    ) {
                        throw new RelayFailure('bad_request', 'supply the target counter and root');
                    }

                    return { ...(await host.revert(device, p.counter, p.root)) };
                case 'catchUp':
                    return { ...(await host.catchUp(device)) };
                case 'flush':
                    return { ...(await host.flush(device, { maxBatch: p.maxBatch })) };
                case 'status':
                    return host.status();
                default:
                    throw new RelayFailure('bad_request', `unknown method ${String(call.method)}`);
            }
        };

        socket.on('message', data => {
            let frame: ClientFrame;
            try {
                frame = JSON.parse(String(data));
            } catch {
                return fail(0, 'bad_request', 'not JSON');
            }
            if (typeof frame?.id !== 'number') return fail(0, 'bad_request', 'no id');
            if (socket.readyState !== WebSocket.OPEN) return;
            if ('deviceReply' in frame) {
                const waiting = takePending(frame.id);
                if (!waiting) return fail(frame.id, 'bad_request', 'no deviceCall is waiting');

                return waiting.resolve(frame.deviceReply);
            }
            const { id } = frame;
            if (active.has(id)) {
                const reason = 'call id is already in use';
                socket.close(1008, reason);
                cancelPending(reason);

                return;
            }
            active.add(id);
            log(`[${conn}] #${id} ${String(frame.method)}${describeCall(frame)}`);
            handle(frame).then(
                result => {
                    active.delete(id);
                    log(
                        `[${conn}] #${id} ${String(frame.method)} ok ${outcome(frame.method, result)}`,
                    );
                    send({ id, result });
                },
                (e: unknown) => {
                    active.delete(id);
                    log(
                        `[${conn}] #${id} ${String(frame.method)} FAILED ${
                            e instanceof RelayFailure ? e.code : 'internal'
                        }: ${e instanceof Error ? e.message : String(e)}`,
                    );
                    takePending(id);
                    if (e instanceof RelayFailure) fail(id, e.code, e.message);
                    else fail(id, 'internal', e instanceof Error ? e.message : String(e));
                    // a wrong token ends the socket; "hello first" leaves it to say hello
                    if (frame.method === 'hello' && e instanceof RelayFailure) socket.close();
                },
            );
        });
    });

    return {
        port: (wss.address() as AddressInfo).port,
        close: () =>
            new Promise<void>(resolve => {
                for (const client of wss.clients) client.terminate();
                wss.close(() => resolve());
            }),
    };
};
