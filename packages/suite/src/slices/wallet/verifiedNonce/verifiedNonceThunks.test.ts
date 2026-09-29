import type { DesktopApi, VerifiedNonce, VerifiedNonceResult } from '@suite/desktop-app-api';
import { mockVerifiedNonceEvidence } from '@suite/desktop-app-api/mocks';
import { mock } from '@suite-common/dependency-injection';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { type Account, type AccountKey } from '@suite-common/wallet-types';

import { type VerifiedNonceState, verifiedNonceActions } from './verifiedNonceSlice';
import {
    cancelAccountNonceVerificationThunk,
    verifyAccountNonceThunk,
} from './verifiedNonceThunks';

const accountKey = '0xd2674da94285660c9b2353131bef2d8211369a4b-eth-deviceState' as AccountKey;

const account = {
    key: accountKey,
    symbol: 'eth',
    networkType: 'ethereum',
    descriptor: '0xd2674dA94285660c9b2353131bef2d8211369A4B',
} as Account;

const envelope = (requestId: string): VerifiedNonce => ({
    status: 'verified',
    requestId,
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
});

type ThunkState = {
    wallet: { accounts: Account[] };
    verifiedNonce: VerifiedNonceState;
};

const createState = (
    verifiedNonce: VerifiedNonceState = { entries: {}, info: null },
): ThunkState => ({
    wallet: { accounts: [account] },
    verifiedNonce,
});

describe('verifyAccountNonceThunk', () => {
    it('submits the account address under a fresh request id and stores the bound envelope', async () => {
        const verifyAccountNonce = mock<DesktopApi['verifyAccountNonce']>(request =>
            Promise.resolve(envelope(request.requestId)),
        );
        const state = createState();
        const getState = () => state;
        const extra = { services: { desktopApi: { verifyAccountNonce } } };
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await verifyAccountNonceThunk({ accountKey })(dispatch, getState, extra);

        expect(verifyAccountNonce).toHaveBeenCalledWith({
            requestId: expect.stringMatching(/^[A-Za-z0-9_-]{1,64}$/),
            chainId: '1',
            address: account.descriptor,
        });
        const started = actions.find(verifiedNonceActions.verificationStarted.match);
        const finished = actions.find(verifiedNonceActions.verificationFinished.match);
        expect(started?.payload.accountKey).toBe(accountKey);
        expect(finished?.payload).toEqual({
            accountKey,
            requestId: started?.payload.requestId,
            result: envelope(started!.payload.requestId),
        });
    });

    it('turns an envelope for a different request into a failed verification', async () => {
        const verifyAccountNonce = mock<DesktopApi['verifyAccountNonce']>(() =>
            Promise.resolve(envelope('someone-else')),
        );
        const state = createState();
        const getState = () => state;
        const extra = { services: { desktopApi: { verifyAccountNonce } } };
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await verifyAccountNonceThunk({ accountKey })(dispatch, getState, extra);

        const finished = actions.find(verifiedNonceActions.verificationFinished.match);
        expect(finished?.payload.result).toMatchObject({
            status: 'failed',
            code: 'VERIFICATION_FAILED',
        });
    });

    it('turns a rejected desktop call into a retryable failure instead of a stuck job', async () => {
        const verifyAccountNonce = mock<DesktopApi['verifyAccountNonce']>(() =>
            Promise.reject(new Error('handler gone')),
        );
        const state = createState();
        const getState = () => state;
        const extra = { services: { desktopApi: { verifyAccountNonce } } };
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await verifyAccountNonceThunk({ accountKey })(dispatch, getState, extra);

        const finished = actions.find(verifiedNonceActions.verificationFinished.match);
        expect(finished?.payload.result).toMatchObject({
            status: 'failed',
            code: 'WORKER_CRASHED',
            retryable: true,
        });
    });

    it('does not start a second job while one is running for the account', async () => {
        const verifyAccountNonce = mock<DesktopApi['verifyAccountNonce']>(
            () => new Promise<VerifiedNonceResult>(() => undefined),
        );
        const state = createState({
            entries: {
                [accountKey]: { status: 'running', requestId: 'req-1', lastVerified: null },
            },
            info: null,
        });
        const getState = () => state;
        const extra = { services: { desktopApi: { verifyAccountNonce } } };
        const { actions, dispatch } = createMockDispatch({ getState, extra });

        await verifyAccountNonceThunk({ accountKey })(dispatch, getState, extra);

        expect(verifyAccountNonce).not.toHaveBeenCalled();
        expect(actions.find(verifiedNonceActions.verificationStarted.match)).toBeUndefined();
    });
});

describe('cancelAccountNonceVerificationThunk', () => {
    it('cancels the running request of the account and nothing else', async () => {
        const cancelAccountNonceVerification = mock<DesktopApi['cancelAccountNonceVerification']>(
            () => Promise.resolve(),
        );
        const state = createState({
            entries: {
                [accountKey]: { status: 'running', requestId: 'req-1', lastVerified: null },
            },
            info: null,
        });
        const getState = () => state;
        const extra = { services: { desktopApi: { cancelAccountNonceVerification } } };
        const { dispatch } = createMockDispatch({ getState, extra });

        await cancelAccountNonceVerificationThunk({ accountKey })(dispatch, getState, extra);
        expect(cancelAccountNonceVerification).toHaveBeenCalledWith({ requestId: 'req-1' });

        const idle = createState();
        await cancelAccountNonceVerificationThunk({ accountKey })(dispatch, () => idle, extra);
        expect(cancelAccountNonceVerification).toHaveBeenCalledTimes(1);
    });
});
