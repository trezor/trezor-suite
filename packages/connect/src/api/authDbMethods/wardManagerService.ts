import { ZERO_MAC_HEX, signWardUpdate, signWmAttestation } from '@trezor/ward/src/mocks';

export type WardCheckpoint = {
    walletId: string;
    counter: number;
    mac?: string;
    nonce: string;
};

export type WardCandidate = {
    walletId: string;
    counter: number;
    mac?: string;
};

export interface WardManagerService {
    signAttestation(checkpoint: WardCheckpoint): Promise<string>;
    signCandidate(candidate: WardCandidate): Promise<string>;
}

/**
 * Raised by a commit that lost the compare-and-set race at the WM: another client
 * advanced the ward past `counter - 1` first. Carries the WM's current authoritative
 * `(counter, mac)` so the sync state machine can re-sync and retry (WP-S2 / D3).
 */
export class WardCommitConflictError extends Error {
    readonly counter: number;
    readonly mac?: string;

    constructor(counter: number, mac?: string) {
        super(`WARD Manager commit conflict: ward is already at counter ${counter}`);
        this.name = 'WardCommitConflictError';
        this.counter = counter;
        this.mac = mac;
    }
}

/**
 * DEV/TEST mock WM: signs with the well-known debug key in-process. Default so unit
 * tests and offline/dev flows work without a running WM service.
 */
class MockWardManagerService implements WardManagerService {
    signAttestation({ walletId, nonce, counter, mac }: WardCheckpoint): Promise<string> {
        return Promise.resolve(signWmAttestation(walletId, nonce, counter, mac ?? ZERO_MAC_HEX));
    }

    signCandidate({ walletId, counter, mac }: WardCandidate): Promise<string> {
        return Promise.resolve(signWardUpdate(walletId, counter, mac ?? ZERO_MAC_HEX));
    }
}

/**
 * Real out-of-process WM client. Talks to the WARD Manager service (built on the
 * Quota Manager) over HTTP. The ward is keyed by a static `wardId` (the device
 * wallet_id, stable per seed+passphrase) — NOT the Evolu ownerId, which can rotate.
 * The WM signs the firmware preimages ("WARD ATTEST v1" / "WARD FINAL v1") with its
 * provisioned Ed25519 key and returns the signature hex.
 *
 * NOTE (MVP): the delegated-key challenge/proof handshake (WP-S4) is not sent yet;
 * add it here (and enforce it server-side) once the delegated identity key is
 * plumbed through. The commit endpoint returns 409 on a compare-and-set conflict,
 * surfaced here as WardCommitConflictError.
 */
export class HttpWardManagerService implements WardManagerService {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        // Normalise: drop a trailing slash so `${baseUrl}/ward/attest` is well-formed.
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async signAttestation({ walletId, nonce, counter, mac }: WardCheckpoint): Promise<string> {
        const res = await this.post('/ward/attest', {
            wardId: walletId,
            nonce,
            counter,
            ...(mac !== undefined && { mac }),
        });

        return res.signature;
    }

    async signCandidate({ walletId, counter, mac }: WardCandidate): Promise<string> {
        const response = await fetch(`${this.baseUrl}/ward/commit`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                wardId: walletId,
                counter,
                ...(mac !== undefined && { mac }),
            }),
        });

        if (response.status === 409) {
            const body = await response.json().catch(() => ({}));
            throw new WardCommitConflictError(body.counter ?? counter, body.mac);
        }
        if (!response.ok) {
            throw new Error(`WARD Manager /ward/commit failed: HTTP ${response.status}`);
        }
        const body = await response.json();

        return body.signature;
    }

    private async post(path: string, payload: Record<string, unknown>) {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`WARD Manager ${path} failed: HTTP ${response.status}`);
        }

        return response.json();
    }
}

let wardManagerService: WardManagerService = new MockWardManagerService();

export const getWardManagerService = () => wardManagerService;

/** Swap the active WM implementation (e.g. inject an HttpWardManagerService). */
export const setWardManagerService = (service: WardManagerService) => {
    wardManagerService = service;
};
