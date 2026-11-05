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
import { ZERO_MAC_HEX, signWardUpdate, signWmAttestation } from '@trezor/ward/src/mocks';

import { type Log, silentLog, startActivity } from './logging';
import { forwardingDelay } from './pacing';

export type WmAttestRequest = { wardId: string; nonce: string; counter: number; mac?: string };
export type WmCommitRequest = { wardId: string; counter: number; mac?: string };

export interface WmClient {
    attest(request: WmAttestRequest): Promise<string>;
    commit(request: WmCommitRequest): Promise<string>;
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
    constructor(
        private readonly log: Log = silentLog,
        private readonly delays = false,
    ) {}

    attest = ({ wardId, nonce, counter, mac }: WmAttestRequest) =>
        this.sign('attest', counter, () =>
            signWmAttestation(wardId, nonce, counter, mac ?? ZERO_MAC_HEX),
        );

    commit = ({ wardId, counter, mac }: WmCommitRequest) =>
        this.sign('commit', counter, () => signWardUpdate(wardId, counter, mac ?? ZERO_MAC_HEX));

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

    async commit({ wardId, counter, mac }: WmCommitRequest) {
        const body = await this.post('/ward/commit', {
            wardId,
            counter,
            ...(mac !== undefined && { mac }),
        });

        return body.signature;
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
            const response = await fetch(`${this.baseUrl}${path}`, {
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
