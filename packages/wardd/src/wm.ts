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
    attest({ wardId, nonce, counter, mac }: WmAttestRequest) {
        return Promise.resolve(signWmAttestation(wardId, nonce, counter, mac ?? ZERO_MAC_HEX));
    }

    commit({ wardId, counter, mac }: WmCommitRequest) {
        return Promise.resolve(signWardUpdate(wardId, counter, mac ?? ZERO_MAC_HEX));
    }
}

/** A running WARD Manager: `POST /ward/attest` and `POST /ward/commit`, 409 on a lost CAS. */
export class HttpWm implements WmClient {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
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
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (response.status === 409) {
            const body = await response.json().catch(() => ({}));
            throw new WmConflict(body.counter ?? Number(payload.counter), body.mac);
        }
        if (!response.ok) {
            throw new Error(`WARD Manager ${path} failed: HTTP ${response.status}`);
        }

        return (await response.json()) as { signature: string };
    }
}
