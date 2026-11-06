/**
 * The WARD Manager seam: the WM's Ed25519 signatures the device verifies, over `wardId` (the
 * device's SLIP21-derived WM-facing anchor, never the local wallet_id or an Evolu owner id).
 *
 *   attest   "WARD ATTEST v1" || version || nonce || ward_id || counter || mac   (WARDIngestAttestation)
 *   commit   "WARD FINAL v1"  || ward_id || counter || mac                       (WARDConfirmedByWM)
 *
 * Moved here from Connect: only wardd talks to the WM. `MockWm` signs in-process with the debug
 * key that only debug firmware accepts; `HttpWm` calls a running WARD Manager.
 *
 * TODO(gap 2): `attest` signs the head wardd supplies -- a signing oracle. A hardened WM must sign
 * its OWN stored head for `wardId` (input `{ wardId, nonce }`, output the head it signed).
 */
import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';

import { ZERO_MAC_HEX, signWardUpdate, signWmAttestation } from '@trezor/ward/src/mocks';

import { type Log, silentLog, startActivity } from './logging';
import { forwardingDelay } from './pacing';
import { type SignedTransition, genesisNonce, normalizeRoot, verifyTransition } from './transition';

export type WmAttestRequest = { wardId: string; nonce: string; counter: number; mac?: string };
export type WmCommitRequest = SignedTransition;
export type WmHead = {
    counter: number;
    root: string;
    mac?: string;
    headNonce: string;
    timestamp: number;
};
export type WmAttestation = WmHead & { signature: string };

export interface WmClient {
    attest(request: WmAttestRequest): Promise<string>;
    commit(request: WmCommitRequest): Promise<string>;
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

/** DEV/TEST: signs with the well-known debug key, in-process and stateless. */
export class MockWm implements WmClient {
    private readonly heads = new Map<string, WmHead>();
    private readonly records = new Map<string, SignedTransition[]>();
    constructor(
        private readonly log: Log = silentLog,
        private readonly delays = false,
    ) {}

    async current(wardId: string, nonce: string): Promise<WmAttestation> {
        const head = this.heads.get(wardId) ?? {
            counter: 0,
            root: '',
            headNonce: genesisNonce(wardId),
            timestamp: 0,
        };
        const timestamp = Math.max(Math.floor(Date.now() / 1000), head.timestamp);
        const signature = await this.sign('attest', head.counter, () =>
            signWmAttestation(
                wardId,
                nonce,
                head.counter,
                head.mac ?? ZERO_MAC_HEX,
                undefined,
                timestamp,
                head.headNonce,
            ),
        );

        return { ...head, timestamp, signature };
    }

    history(wardId: string): Promise<SignedTransition[]> {
        return Promise.resolve((this.records.get(wardId) ?? []).map(record => ({ ...record })));
    }

    async attest({ wardId, nonce, counter, mac }: WmAttestRequest) {
        const head = await this.current(wardId, nonce);
        if (counter !== head.counter || mac !== head.mac)
            throw new WmConflict(head.counter, head.mac);

        return head.signature;
    }

    commit(request: WmCommitRequest) {
        verifyTransition(request);
        const { wardId, counter, mac } = request;
        const head = this.heads.get(wardId) ?? {
            counter: 0,
            root: '',
            headNonce: genesisNonce(wardId),
            timestamp: 0,
        };
        const records = this.records.get(wardId) ?? [];
        const record = {
            ...request,
            root: normalizeRoot(request.root),
            fromRoot: normalizeRoot(request.fromRoot),
        };
        const retry =
            counter === head.counter && JSON.stringify(records.at(-1)) === JSON.stringify(record);
        if (
            !retry &&
            (request.fromCounter !== head.counter ||
                record.fromRoot !== head.root ||
                record.headNonce !== head.headNonce)
        )
            throw new WmConflict(head.counter, head.mac);
        if (!retry) {
            records.push(record);
            this.records.set(wardId, records);
            this.heads.set(wardId, {
                counter,
                root: record.root,
                mac,
                headNonce: bytesToHex(randomBytes(32)),
                timestamp: Math.max(Math.floor(Date.now() / 1000), head.timestamp),
            });
        }

        return this.sign('commit', counter, () => signWardUpdate(wardId, counter, mac));
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

/** A running WARD Manager: `POST /ward/attest` and `POST /ward/commit`, 409 on a lost CAS. */
export class HttpWm implements WmClient {
    private readonly baseUrl: string;

    constructor(
        baseUrl: string,
        private readonly log: Log = silentLog,
        private readonly delays = false,
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async attest({ wardId, nonce, counter, mac }: WmAttestRequest) {
        const body = await this.post('/ward/attest', {
            wardId,
            nonce,
            counter,
            ...(mac !== undefined && { mac }),
        });

        return body.signature;
    }

    async commit(request: WmCommitRequest) {
        const body = await this.post('/ward/commit', request);

        return body.signature;
    }

    async current(wardId: string, nonce: string): Promise<WmAttestation> {
        const body = await this.post('/ward/attest', { wardId, nonce });
        if (typeof body.timestamp !== 'number' || typeof body.headNonce !== 'string')
            throw new Error('WM omitted signed freshness metadata');

        return {
            counter: body.counter ?? 0,
            root: body.root ?? '',
            mac: body.mac,
            signature: body.signature,
            timestamp: body.timestamp,
            headNonce: body.headNonce,
        };
    }

    async history(wardId: string): Promise<SignedTransition[]> {
        const response = await this.request(
            `${this.baseUrl}/ward/${encodeURIComponent(wardId)}/history`,
        );
        if (!response.ok) throw new Error(`WARD Manager history failed: HTTP ${response.status}`);
        const body = (await response.json()) as { transitions: SignedTransition[] };
        body.transitions.forEach(verifyTransition);

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

    private async post(path: string, payload: Record<string, unknown>) {
        const activity = startActivity(this.log, 'wm.http', {
            method: 'POST',
            path,
            counter: payload.counter,
        });
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
                const body = await response.json().catch(() => ({}));
                this.log('wm.head', {
                    source: 'HTTP 409',
                    counter: body.counter,
                    mac: body.mac ?? 'EMPTY',
                });
                throw new WmConflict(body.counter ?? Number(payload.counter), body.mac);
            }
            if (!response.ok) {
                throw new Error(`WARD Manager ${path} failed: HTTP ${response.status}`);
            }

            const body = (await response.json()) as {
                signature: string;
                counter?: number;
                mac?: string;
                root?: string;
                timestamp?: number;
                headNonce?: string;
            };
            if (body.counter !== undefined)
                this.log('wm.head', {
                    source: 'HTTP response',
                    counter: body.counter,
                    mac: body.mac ?? 'EMPTY',
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
