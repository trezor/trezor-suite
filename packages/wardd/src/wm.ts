/**
 * The WARD Manager seam: the WM's Ed25519 signatures the device verifies, over `wardId` (the
 * device's SLIP21-derived WM-facing anchor, never the local wallet_id or an Evolu owner id).
 *
 *   attest   "WARD ATTEST v1" || 0x01 || nonce || ward_id || counter || mac || timestamp
 *                                                                        (WARDIngestAttestation)
 *   commit   "WARD FINAL v1"  || accepted transition body (see `finalizationMessage`)
 *                                       (WARDConfirmBatchByWM / WARDConfirmRevertByWM)
 *
 * The WM stores each ward's latest accepted wallet-signed transition (`SignedTransition`); that
 * transition's counter/root/mac is the head. At genesis there is none: counter 0, empty root, no
 * mac (the zero mac in signed bytes). The WM attests its OWN head over the caller's nonce; wardd
 * never names the checkpoint it wants signed.
 *
 * Moved here from Connect: only wardd talks to the WM. `MockWm` signs in-process with the debug
 * key that only debug firmware accepts; `HttpWm` calls a running WARD Manager.
 */
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import { type WardLeafBlob, commitOf } from '@trezor/ward';
import { DEBUG_QM_SEED, ZERO_MAC_HEX, signWmAttestation } from '@trezor/ward/src/mocks';

import { type Log, silentLog, startActivity } from './logging';
import { forwardingDelay } from './pacing';
import {
    type SignedTransition,
    finalizationMessage,
    normalizeRoot,
    verifyTransition,
} from './transition';

export type WmCommitRequest = SignedTransition;
export type WmHead = {
    counter: number;
    root: string;
    mac?: string;
    timestamp: number;
};
/** The WM's head plus its nonce-bound attestation, and the transition that produced the head. */
export type WmAttestation = WmHead & { signature: string; transition?: SignedTransition };

export interface WmClient {
    commit(request: WmCommitRequest, leaves?: WardLeafBlob[]): Promise<string>;
    current(wardId: string, nonce: string): Promise<WmAttestation>;
    history(wardId: string): Promise<SignedTransition[]>;
}

export class WmUnavailable extends Error {
    constructor() {
        super('WARD Manager unavailable; changes remain queued on the device');
        this.name = 'WmUnavailable';
    }
}

/**
 * A commit that lost the compare-and-set race: another writer advanced the ward past
 * `counter - 1` first. Carries the WM's current head so the caller can sync and retry.
 */
export class WmConflict extends Error {
    constructor(
        readonly counter: number,
        readonly mac?: string,
    ) {
        super(`WARD Manager commit conflict: ward is already at counter ${counter}`);
        this.name = 'WmConflict';
    }
}

/** The head a latest accepted transition names; genesis when there is none. */
const headOf = (transition?: SignedTransition): Omit<WmHead, 'timestamp'> =>
    transition
        ? { counter: transition.counter, root: normalizeRoot(transition.root), mac: transition.mac }
        : { counter: 0, root: '' };

const normalizeTransition = (transition: SignedTransition): SignedTransition => ({
    ...transition,
    fromRoot: normalizeRoot(transition.fromRoot),
    root: normalizeRoot(transition.root),
});

/** DEV/TEST: signs with the well-known debug key, in-process. */
export class MockWm implements WmClient {
    private readonly records = new Map<string, SignedTransition[]>();
    private readonly timestamps = new Map<string, number>();
    constructor(
        private readonly log: Log = silentLog,
        private readonly delays = false,
    ) {}

    async current(wardId: string, nonce: string): Promise<WmAttestation> {
        const transition = this.records.get(wardId)?.at(-1);
        const head = headOf(transition);
        const timestamp = Math.max(Math.floor(Date.now() / 1000), this.timestamps.get(wardId) ?? 0);
        const signature = await this.sign('attest', head.counter, () =>
            signWmAttestation(
                wardId,
                nonce,
                head.counter,
                head.mac ?? ZERO_MAC_HEX,
                undefined,
                timestamp,
            ),
        );

        return {
            ...head,
            timestamp,
            signature,
            ...(transition && { transition: { ...transition } }),
        };
    }

    history(wardId: string): Promise<SignedTransition[]> {
        return Promise.resolve((this.records.get(wardId) ?? []).map(record => ({ ...record })));
    }

    async commit(request: WmCommitRequest) {
        verifyTransition(request);
        const { wardId, counter } = request;
        const records = this.records.get(wardId) ?? [];
        const latest = records.at(-1);
        const head = headOf(latest);
        const record = normalizeTransition(request);
        // An exact retry of the accepted head transition gets the same finalization again.
        const retry = latest !== undefined && JSON.stringify(latest) === JSON.stringify(record);
        if (!retry && (record.fromCounter !== head.counter || record.fromRoot !== head.root))
            throw new WmConflict(head.counter, head.mac);
        if (!retry) {
            records.push(record);
            this.records.set(wardId, records);
            this.timestamps.set(
                wardId,
                Math.max(Math.floor(Date.now() / 1000), this.timestamps.get(wardId) ?? 0),
            );
        }

        const signature = await this.sign('commit', counter, () =>
            bytesToHex(ed25519.sign(finalizationMessage(record), DEBUG_QM_SEED)),
        );

        return signature;
    }

    private async sign(method: string, counter: number, sign: () => string) {
        const activity = startActivity(this.log, `wm.mock.${method}`, { counter });
        try {
            await forwardingDelay(this.log, `wardd -> mock WM ${method}`, this.delays);
            const signature = await Promise.resolve().then(sign);
            activity.success();

            return signature;
        } catch (error) {
            activity.failure(error);
            throw error;
        } finally {
            await forwardingDelay(this.log, `mock WM ${method} -> wardd`, this.delays);
        }
    }
}

type WmResponse = {
    wardId?: string;
    transition?: SignedTransition;
    nonce?: string;
    timestamp?: number;
    signature?: string;
    error?: string;
};

/**
 * A running WARD Manager: `POST /ward/attest`, `POST /ward/commit` (409 on a lost CAS) and
 * `GET /ward/{wardId}/history`.
 */
export class HttpWm implements WmClient {
    private readonly baseUrl: string;

    constructor(
        baseUrl: string,
        private readonly log: Log = silentLog,
        private readonly delays = false,
        private readonly isRecoveryEnabled = false,
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async commit(request: WmCommitRequest, leaves?: WardLeafBlob[]) {
        if (this.isRecoveryEnabled && request.kind === 'commit' && leaves === undefined)
            throw new Error('Recovery requires the complete WARD batch');
        const recoveryLeaves =
            this.isRecoveryEnabled && request.kind === 'commit'
                ? leaves?.map(({ entryKey, keyType, identity, content }) => ({
                      entryKey,
                      valueDigest:
                          content.bodyHex === ''
                              ? null
                              : bytesToHex(commitOf(keyType, identity, content)),
                  }))
                : undefined;
        const body = await this.post('/ward/commit', request.wardId, request.counter, {
            transition: request,
            ...(recoveryLeaves !== undefined && { recoveryLeaves }),
        });
        if (typeof body.signature !== 'string')
            throw new Error('WM omitted the finalization signature');

        return body.signature;
    }

    async current(wardId: string, nonce: string): Promise<WmAttestation> {
        const body = await this.post('/ward/attest', wardId, undefined, { wardId, nonce });
        if (typeof body.timestamp !== 'number' || typeof body.signature !== 'string')
            throw new Error('WM omitted signed freshness metadata');
        if (body.nonce !== undefined && body.nonce !== nonce)
            throw new Error('WM attested another nonce');
        const { transition } = body;
        if (transition) {
            if (transition.wardId !== wardId) throw new Error('WM attested another ward');
            verifyTransition(transition);
        }

        return {
            ...headOf(transition),
            signature: body.signature,
            timestamp: body.timestamp,
            ...(transition && { transition }),
        };
    }

    async history(wardId: string): Promise<SignedTransition[]> {
        const response = await this.request(
            `${this.baseUrl}/ward/${encodeURIComponent(wardId)}/history`,
        );
        if (!response.ok) throw new Error(`WARD Manager history failed: HTTP ${response.status}`);
        const body = (await response.json()) as {
            wardId?: string;
            transitions: SignedTransition[];
        };
        if (body.wardId !== undefined && body.wardId !== wardId)
            throw new Error('WM history names another ward');
        body.transitions.forEach(transition => {
            if (transition.wardId !== wardId) throw new Error('WM history names another ward');
            verifyTransition(transition);
        });

        return body.transitions;
    }

    private async request(url: string, options?: RequestInit): Promise<Response> {
        let response: Response;
        try {
            response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
        } catch {
            throw new WmUnavailable();
        }
        if (response.status >= 500) throw new WmUnavailable();

        return response;
    }

    private async post(
        path: string,
        wardId: string,
        counter: number | undefined,
        payload: Record<string, unknown>,
    ): Promise<WmResponse> {
        const activity = startActivity(this.log, 'wm.http', { method: 'POST', path, counter });
        let status: number | undefined;
        try {
            await forwardingDelay(this.log, `wardd -> WM ${path}`, this.delays);
            const response = await this.request(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            });
            status = response.status;
            if (response.status === 409) {
                const body = (await response.json().catch(() => ({}))) as WmResponse;
                // The latest accepted transition names the head that won; none means genesis.
                const head = headOf(
                    body.transition?.wardId === wardId ? body.transition : undefined,
                );
                this.log('wm.head', {
                    source: 'HTTP 409',
                    error: body.error,
                    counter: head.counter,
                    mac: head.mac ?? 'EMPTY',
                });
                throw new WmConflict(head.counter, head.mac);
            }
            if (!response.ok) {
                throw new Error(`WARD Manager ${path} failed: HTTP ${response.status}`);
            }

            const body = (await response.json()) as WmResponse;
            if (body.wardId !== undefined && body.wardId !== wardId)
                throw new Error(`WARD Manager ${path} answered for another ward`);
            const head = headOf(body.transition);
            this.log('wm.head', {
                source: 'HTTP response',
                counter: head.counter,
                mac: head.mac ?? 'EMPTY',
            });
            activity.success({ status });

            return body;
        } catch (error) {
            activity.failure(error, { status });
            throw error;
        } finally {
            await forwardingDelay(this.log, `WM ${path} -> wardd`, this.delays);
        }
    }
}
