/**
 * wardd as a service: what a host library calls, in-process (Connect) or through the WebSocket
 * server (HWI). Both reach the same `WardRelay` -- `connect()` hands out an endpoint, and an
 * endpoint's `call` runs one relay method.
 *
 * ONE CONVERSATION AT A TIME, across all endpoints: a conversation reads the stored head, the
 * device answers against it, and a write lands on top of it -- two interleaved would serve one a
 * tree the other just moved. `answerProofRequest` is not locked: it is how a running conversation's own
 * pulls are answered.
 */
import { randomBytes } from 'crypto';

import {
    RELAY_CONVERSATIONS,
    type RelayDevice,
    RelayFailure,
    type RelayMethod,
    type WardProvider,
    type WardRelay,
    type WardRelayEndpoint,
} from '@trezor/ward';

import { type Log, WardHost } from './host';
import { forwardingDelay, pacedStorage } from './pacing';
import { reconstructAvailable } from './recoveryReconstruction';
import { type WmClient, WmUnavailable } from './wm';

export type WarddOptions = {
    storage: WardProvider;
    wm: WmClient;
    log?: Log;
    delays?: boolean;
    /** Attach a WM freshness attestation to label proofs (see `WardHostDeps.labelFreshness`). */
    labelFreshness?: boolean;
    debugDropTransition?: (wardId: string, counter: number, root: string) => Promise<void>;
};

export class Wardd implements WardRelay {
    private queue: Promise<unknown> = Promise.resolve();
    private serviceQueue: Promise<unknown> = Promise.resolve();
    private readonly storage: WardProvider;
    private readonly wm: WmClient;
    private readonly log: Log;
    private readonly delays: boolean;
    private readonly labelFreshness: boolean;
    private readonly pausedDevices = new Set<string>();
    private readonly dropTransition?: WarddOptions['debugDropTransition'];

    constructor(options: WarddOptions) {
        this.log = options.log ?? (() => {});
        this.delays = options.delays ?? false;
        this.labelFreshness = options.labelFreshness ?? false;
        this.storage = pacedStorage(options.storage, this.log, this.delays);
        this.wm = options.wm;
        this.dropTransition = options.debugDropTransition;
    }

    /** Run `fn` after every conversation queued before it; a failed one does not block the next. */
    private exclusive<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.queue.then(fn, fn);
        this.queue = run.catch(() => {});

        return run;
    }

    // A wallet conversation can be waiting for this same daemon through the device's
    // service interface. Sharing its outer lock would deadlock that reverse RPC.
    private serviceExclusive<T>(fn: () => Promise<T>): Promise<T> {
        const run = this.serviceQueue.then(fn, fn);
        this.serviceQueue = run.catch(() => {});

        return run;
    }

    setPaused(deviceId: string, paused: boolean): Promise<void> {
        if (paused) this.pausedDevices.add(deviceId);
        else this.pausedDevices.delete(deviceId);
        this.log('debug.connectivity', { deviceId, paused });

        return Promise.resolve();
    }

    debugReconstruct(wardId: string) {
        return this.exclusive(async () => {
            const head = await this.wm.current(wardId, randomBytes(32).toString('hex'));
            const history = await this.wm.history(wardId);
            const rebuilt = await reconstructAvailable({
                storage: this.storage,
                wardId,
                head,
                history,
                log: this.log,
            });

            return {
                headCounter: head.counter,
                counter: rebuilt.counter,
                root: rebuilt.root,
                entries: rebuilt.blobs.length,
                complete: rebuilt.complete,
                missingCounter: rebuilt.missingCounter,
            };
        });
    }

    debugDrop(wardId: string, counter: number, root: string) {
        return this.exclusive(async () => {
            if (!this.dropTransition) throw new Error('storage fault injection is disabled');
            await this.dropTransition(wardId, counter, root);
            this.log('debug.evolu.drop', { counter });
        });
    }

    connect(): Promise<WardRelayEndpoint> {
        let deviceId: string | undefined;
        const available = () => {
            if (this.pausedDevices.has(deviceId ?? 'device-1')) throw new WmUnavailable();
        };
        const wm: WmClient = {
            current: (...args) => {
                available();

                return this.wm.current(...args);
            },
            commit: (...args) => {
                available();

                return this.wm.commit(...args);
            },
            history: (...args) => {
                available();

                return this.wm.history(...args);
            },
            attest: (...args) => {
                available();

                return this.wm.attest(...args);
            },
        };
        const host = new WardHost({
            storage: this.storage,
            wm,
            log: this.log,
            delays: this.delays,
            labelFreshness: this.labelFreshness,
        });
        let closed = false;

        const dispatch = (
            method: RelayMethod,
            params: Record<string, unknown>,
            device?: RelayDevice,
        ): Promise<unknown> => {
            if (RELAY_CONVERSATIONS.includes(method) && !device) {
                throw new RelayFailure('bad_request', `${method} needs the device`);
            }
            switch (method) {
                case 'serviceSync':
                    return this.serviceExclusive(() => host.serviceSync(device!, params));
                case 'servicePublish':
                    return this.serviceExclusive(() => host.servicePublish(device!, params));
                case 'sync':
                    return this.exclusive(() => host.syncAndValidate(device!, params));
                case 'lookup':
                    return this.exclusive(() => host.lookup(device!, params));
                case 'update':
                    return this.exclusive(() => host.update(device!, params));
                case 'listEntries':
                    return this.exclusive(() => host.listEntries(device!, params));
                case 'cacheEntry':
                    return this.exclusive(() => host.cacheEntry(device!, params));
                case 'exportCache':
                    return this.exclusive(() => host.exportCache(device!));
                case 'importCache':
                    return this.exclusive(() => host.importCache(device!, params));
                case 'validateCache':
                    return this.exclusive(() => host.validateCache(device!, params));
                case 'answerProofRequest':
                    return host.answerProofRequest(params);
                case 'answerNodeRequest':
                    return host.answerNodeRequest(params);
                case 'status':
                    return host.status();
                default:
                    throw new RelayFailure('bad_request', `unknown method ${String(method)}`);
            }
        };

        return Promise.resolve({
            call: async (method, params = {}, device) => {
                if (closed) throw new RelayFailure('bad_request', 'the endpoint is closed');
                if (params.debugDeviceId !== undefined) {
                    if (
                        typeof params.debugDeviceId !== 'string' ||
                        !/^[a-zA-Z0-9_-]{1,64}$/.test(params.debugDeviceId) ||
                        (deviceId !== undefined && params.debugDeviceId !== deviceId)
                    )
                        throw new RelayFailure('bad_request', 'invalid or changed debug device ID');
                    deviceId = params.debugDeviceId;
                }

                await forwardingDelay(this.log, `host -> wardd.${method}`, this.delays);
                try {
                    return (await dispatch(method, params, device)) as Record<string, unknown>;
                } finally {
                    await forwardingDelay(this.log, `wardd.${method} -> host`, this.delays);
                }
            },
            close: () => {
                closed = true;
            },
        });
    }

    async dispose() {
        await this.storage.dispose?.();
    }
}
