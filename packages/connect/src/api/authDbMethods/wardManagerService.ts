import { ZERO_MAC_HEX, signWardUpdate, signWmAttestation } from '@trezor/authdb/src/mocks';

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
 * Current mock WM implementation.
 *
 * Kept behind a service boundary so Connect methods talk to "a WM service"
 * instead of importing signing helpers directly. Replacing this with an
 * out-of-process WM later should only require swapping this implementation.
 */
class MockWardManagerService implements WardManagerService {
    signAttestation({ walletId, nonce, counter, mac }: WardCheckpoint): Promise<string> {
        return Promise.resolve(signWmAttestation(walletId, nonce, counter, mac ?? ZERO_MAC_HEX));
    }

    signCandidate({ walletId, counter, mac }: WardCandidate): Promise<string> {
        return Promise.resolve(signWardUpdate(walletId, counter, mac ?? ZERO_MAC_HEX));
    }
}

const wardManagerService: WardManagerService = new MockWardManagerService();

export const getWardManagerService = () => wardManagerService;
