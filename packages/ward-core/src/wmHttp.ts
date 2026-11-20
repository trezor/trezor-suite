/**
 * The WARD Manager over HTTP: the `WmClient` wardd uses when the WM runs as its own process
 * (`wardd --wm URL`, served by `wardd/src/wmServer.ts`).
 *
 * Bytes travel as hex, an absent root as null. A refused compare-and-swap comes back as
 * `WmConflict`, exactly as from the in-process WM; a WM that cannot be reached at all comes back
 * as `WmUnavailable`, so a caller can tell "the WM said no" from "there is no WM to ask".
 */
import { ed25519 } from '@noble/curves/ed25519.js';

import { toBytes, toHex } from './bytes';
import { type Attestation, DEBUG_WM_SEED, type WmClient, WmConflict } from './wm';

/** The WM did not answer: down, unreachable, or not speaking this API. */
export class WmUnavailable extends Error {
    constructor(reason: string) {
        super(`the WARD Manager is unavailable: ${reason}`);
        this.name = 'WmUnavailable';
    }
}

/** An attestation as the WM API carries it. */
export interface AttestationJson {
    fromCounter: number;
    fromRoot: string;
    fromHeadNonce: string;
    toCounter: number;
    toRoot: string;
    toHeadNonce: string;
    timestamp: number;
    signature: string;
}

export const attestationToJson = (a: Attestation): AttestationJson => ({
    fromCounter: a.fromCounter,
    fromRoot: toHex(a.fromRoot),
    fromHeadNonce: toHex(a.fromHeadNonce),
    toCounter: a.toCounter,
    toRoot: toHex(a.toRoot),
    toHeadNonce: toHex(a.toHeadNonce),
    timestamp: a.timestamp,
    signature: toHex(a.signature),
});

const attestationFromJson = (a: AttestationJson): Attestation => ({
    fromCounter: a.fromCounter,
    fromRoot: toBytes(a.fromRoot),
    fromHeadNonce: toBytes(a.fromHeadNonce),
    toCounter: a.toCounter,
    toRoot: toBytes(a.toRoot),
    toHeadNonce: toBytes(a.toHeadNonce),
    timestamp: a.timestamp,
    signature: toBytes(a.signature),
});

const hexOrNull = (v: Uint8Array | null | undefined) => (v ? toHex(v) : null);

export class HttpWm implements WmClient {
    private readonly base: string;

    /**
     * `pubkey` is the key the device trusts, pinned rather than fetched: wardd must start, and
     * say so, while the WM is down.
     */
    constructor(
        url: string,
        readonly pubkey: Uint8Array = ed25519.getPublicKey(DEBUG_WM_SEED),
        private readonly timeoutMs = 5000,
    ) {
        this.base = url.replace(/\/+$/, '');
    }

    private async call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
        let res: Response;
        try {
            res = await fetch(`${this.base}${path}`, {
                method,
                headers: body === undefined ? undefined : { 'content-type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body),
                signal: AbortSignal.timeout(this.timeoutMs),
            });
        } catch (e) {
            throw new WmUnavailable(
                e instanceof Error ? ((e.cause as Error)?.message ?? e.message) : String(e),
            );
        }
        const json = (await res.json().catch(() => null)) as
            (T & { error?: string; headCounter?: number }) | null;
        if (res.status === 409 && json?.error === 'conflict') {
            throw new WmConflict(json.headCounter ?? 0);
        }
        if (!res.ok || json === null) {
            if (res.status >= 500 || json === null) {
                throw new WmUnavailable(`HTTP ${res.status}`);
            }
            throw new Error(json.error ?? `WM refused with HTTP ${res.status}`);
        }

        return json;
    }

    private path(wardId: Uint8Array, op: string) {
        return `/v1/wards/${toHex(wardId)}/${op}`;
    }

    async enrol(wardId: Uint8Array, root: Uint8Array | null, headInitSig: Uint8Array) {
        await this.call('POST', this.path(wardId, 'enrol'), {
            root: hexOrNull(root),
            headInitSig: toHex(headInitSig),
        });
    }

    async attest(wardId: Uint8Array, nonce: Uint8Array) {
        return attestationFromJson(
            await this.call<AttestationJson>('POST', this.path(wardId, 'attest'), {
                nonce: toHex(nonce),
            }),
        );
    }

    async advance(step: Parameters<WmClient['advance']>[0]) {
        const { revert } = await this.call<{ revert: boolean }>(
            'POST',
            this.path(step.wardId, 'advance'),
            {
                fromCounter: step.fromCounter,
                fromRoot: hexOrNull(step.fromRoot),
                toCounter: step.toCounter,
                toRoot: hexOrNull(step.toRoot),
                wmSig: toHex(step.wmSig),
                ...(step.timestamp === undefined ? {} : { timestamp: step.timestamp }),
            },
        );

        return revert;
    }

    private async headRecord(wardId: Uint8Array) {
        return (
            await this.call<{
                head: { counter: number; root: string | null; headNonce: string } | null;
            }>('GET', this.path(wardId, 'head'))
        ).head;
    }

    async headNonce(wardId: Uint8Array) {
        const head = await this.headRecord(wardId);

        return head ? toBytes(head.headNonce) : null;
    }

    async head(wardId: Uint8Array) {
        const head = await this.headRecord(wardId);

        return head ? { counter: head.counter, root: head.root ? toBytes(head.root) : null } : null;
    }
}
