import type { NonceFailure, VerifiedNonce } from '@suite/desktop-app-api';
import { mockVerifiedNonceEvidence } from '@suite/desktop-app-api/mocks';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    type VerifiedNonceState,
    isVerifiedNonceCurrent,
    selectVerifiedNonceEntry,
    verifiedNonceActions,
    verifiedNonceReducer,
} from './verifiedNonceSlice';

const accountKey = '0xd2674da94285660c9b2353131bef2d8211369a4b-eth-deviceState' as AccountKey;

const verified = (overrides: Partial<VerifiedNonce> = {}): VerifiedNonce => ({
    status: 'verified',
    requestId: 'req-1',
    chainId: '1',
    address: '0xd2674da94285660c9b2353131bef2d8211369a4b',
    nonce: '309747',
    block: {
        hash: `0x${'ab'.repeat(32)}`,
        number: '22196327',
        timestampSeconds: '1743779015',
        status: 'authenticated-recent',
    },
    verifiedAtMs: 1743779020000,
    expiresAtMs: 1743779075000,
    verifier: { location: 'desktop', runtime: 'native', revision: '3.0.0', trustPolicyId: 'p' },
    evidence: mockVerifiedNonceEvidence(),
    ...overrides,
});

const failed: NonceFailure = {
    status: 'failed',
    requestId: 'req-2',
    code: 'STALE_PROOF',
    retryable: true,
};

const reduce = (...actions: Parameters<typeof verifiedNonceReducer>[1][]) =>
    actions.reduce(verifiedNonceReducer, undefined as unknown as VerifiedNonceState);

describe('verifiedNonceSlice', () => {
    it('records a verified envelope for the request that is running', () => {
        const state = reduce(
            verifiedNonceActions.verificationStarted({ accountKey, requestId: 'req-1' }),
            verifiedNonceActions.verificationFinished({
                accountKey,
                requestId: 'req-1',
                result: verified(),
            }),
        );

        expect(selectVerifiedNonceEntry({ verifiedNonce: state }, accountKey)).toEqual({
            status: 'verified',
            requestId: 'req-1',
            result: verified(),
        });
    });

    it('discards a late reply once a newer request has started', () => {
        const state = reduce(
            verifiedNonceActions.verificationStarted({ accountKey, requestId: 'req-1' }),
            verifiedNonceActions.verificationStarted({ accountKey, requestId: 'req-2' }),
            verifiedNonceActions.verificationFinished({
                accountKey,
                requestId: 'req-1',
                result: verified(),
            }),
        );

        expect(selectVerifiedNonceEntry({ verifiedNonce: state }, accountKey)).toEqual({
            status: 'running',
            requestId: 'req-2',
            lastVerified: null,
        });
    });

    it('keeps the last verified nonce as history when a later run fails', () => {
        const state = reduce(
            verifiedNonceActions.verificationStarted({ accountKey, requestId: 'req-1' }),
            verifiedNonceActions.verificationFinished({
                accountKey,
                requestId: 'req-1',
                result: verified(),
            }),
            verifiedNonceActions.verificationStarted({ accountKey, requestId: 'req-2' }),
            verifiedNonceActions.verificationFinished({
                accountKey,
                requestId: 'req-2',
                result: failed,
            }),
        );

        expect(selectVerifiedNonceEntry({ verifiedNonce: state }, accountKey)).toEqual({
            status: 'failed',
            requestId: 'req-2',
            failure: failed,
            lastVerified: verified(),
        });
    });

    it('never populates another account with a reply', () => {
        const otherKey = `${'0x11'.padEnd(42, '1')}-eth-deviceState` as AccountKey;
        const state = reduce(
            verifiedNonceActions.verificationStarted({ accountKey, requestId: 'req-1' }),
            verifiedNonceActions.verificationFinished({
                accountKey: otherKey,
                requestId: 'req-1',
                result: verified(),
            }),
        );

        expect(selectVerifiedNonceEntry({ verifiedNonce: state }, otherKey)).toBeNull();
        expect(selectVerifiedNonceEntry({ verifiedNonce: state }, accountKey)).toMatchObject({
            status: 'running',
        });
    });

    it('treats a result as current only until its authenticated block leaves the window', () => {
        expect(isVerifiedNonceCurrent(verified(), 1743779074999)).toBe(true);
        expect(isVerifiedNonceCurrent(verified(), 1743779075000)).toBe(false);
    });
});
