import { getRuntime } from '@corpus-core/colibri-stateless';
import { EventEmitter } from 'events';

import {
    type NonceVerifier,
    createFileStorage,
    createNonceVerifier,
    mainnetTrustManifest,
} from '@suite/colibri-nonce-verifier';
import type {
    NonceVerifierInfo,
    VerifiedNonceRequest,
    VerifiedNonceResult,
} from '@suite/desktop-app-api';
import { createInterceptor } from '@trezor/request-manager';

import { createThread } from '../libs/thread';

type ColibriNonceVerifierThreadSettings = {
    storageDirectory: string;
    torSettings: TorSettings;
};

export type ColibriNonceVerifierLogEvent = { level: 'info' | 'warn'; message: string };

const { prover, beaconApi, checkpointz } = mainnetTrustManifest.endpoints;
const whitelistedDomains = [...prover, ...beaconApi, ...checkpointz].map(
    url => new URL(url).hostname,
);

/**
 * Owns the single Colibri runtime of this utility process. Requests are already serialized by
 * the verifier; the interceptor keeps traffic on the manifest's endpoints and routes it through
 * Tor when the user enabled it.
 */
export class ColibriNonceVerifierThread extends EventEmitter {
    private torSettings: TorSettings;
    private readonly verifier: NonceVerifier;
    private readonly jobs = new Map<string, AbortController>();

    constructor({ storageDirectory, torSettings }: ColibriNonceVerifierThreadSettings) {
        super();
        this.torSettings = torSettings;

        createInterceptor({
            handler: event => this.emit('interceptor', event),
            getTorSettings: () => this.torSettings,
            getWhitelistedDomains: () => whitelistedDomains,
        });

        this.verifier = createNonceVerifier(
            {
                clock: { nowMs: () => Date.now(), monotonicMs: () => performance.now() },
                getColibriRuntime: getRuntime,
                // Resolved per call: the interceptor swaps the global fetch when Tor is running.
                fetch: (url, init) => globalThis.fetch(url, init),
                logger: {
                    info: message => this.emitLog('info', message),
                    warn: message => this.emitLog('warn', message),
                },
            },
            {
                trustManifest: mainnetTrustManifest,
                storage: createFileStorage(storageDirectory),
                allowedRuntimeKinds: ['native'],
            },
        );
    }

    private emitLog(level: ColibriNonceVerifierLogEvent['level'], message: string) {
        this.emit('log', { level, message } satisfies ColibriNonceVerifierLogEvent);
    }

    public setTorSettings(torSettings: TorSettings) {
        this.torSettings = torSettings;
    }

    public getInfo(): Promise<NonceVerifierInfo> {
        return this.verifier.getInfo();
    }

    public async verify(request: VerifiedNonceRequest): Promise<VerifiedNonceResult> {
        const controller = new AbortController();
        this.jobs.set(request.requestId, controller);
        try {
            return await this.verifier.verify(request, controller.signal);
        } finally {
            this.jobs.delete(request.requestId);
        }
    }

    public cancel(requestId: string): boolean {
        const controller = this.jobs.get(requestId);
        controller?.abort();

        return controller !== undefined;
    }
}

createThread(
    (settings: ColibriNonceVerifierThreadSettings) => new ColibriNonceVerifierThread(settings),
);
