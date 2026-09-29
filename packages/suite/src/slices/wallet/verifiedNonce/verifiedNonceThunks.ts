import type {
    DesktopApiDep,
    NonceFailure,
    NonceFailureCode,
    VerifiedNonceResult,
} from '@suite/desktop-app-api';
import { type WithServices, createThunk } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    type VerifiedNonceRootState,
    selectVerifiedNonceEntry,
    verifiedNonceActions,
} from './verifiedNonceSlice';

const actionPrefix = '@suite/verifiedNonce';

// Only mainnet ETH accounts (chain id 1) are supported by the bundled verifier.
const SUPPORTED_SYMBOL = 'eth';

const createRequestId = () => crypto.randomUUID();

type VerifyAccountNonceThunkState = AccountsRootState & VerifiedNonceRootState;

type VerifyAccountNonceThunkDeps = WithServices<DesktopApiDep<'verifyAccountNonce'>>;

export const verifyAccountNonceThunk = createThunk<
    void,
    { accountKey: AccountKey },
    { state: VerifyAccountNonceThunkState; extra: VerifyAccountNonceThunkDeps }
>(`${actionPrefix}/verifyAccountNonce`, async ({ accountKey }, { dispatch, getState, extra }) => {
    const account = selectAccountByKey(getState(), accountKey);
    if (account?.networkType !== 'ethereum') return;
    // A running job for this account is already tracked; the desktop side coalesces duplicates.
    if (selectVerifiedNonceEntry(getState(), accountKey)?.status === 'running') return;

    const requestId = createRequestId();
    dispatch(verifiedNonceActions.verificationStarted({ accountKey, requestId }));

    const failure = (code: NonceFailureCode, retryable: boolean): NonceFailure => ({
        status: 'failed',
        requestId,
        code,
        retryable,
    });

    let result: VerifiedNonceResult;
    if (account.symbol !== SUPPORTED_SYMBOL) {
        result = failure('UNSUPPORTED_CHAIN', false);
    } else {
        try {
            result = await extra.services.desktopApi.verifyAccountNonce({
                requestId,
                chainId: '1',
                address: account.descriptor,
            });
        } catch {
            // A rejected invoke (main-side throw, handler gone during a reload) must not leave the
            // account stuck in "verifying".
            result = failure('WORKER_CRASHED', true);
        }
    }

    // The envelope must name this request; anything else is treated as a failed verification.
    const bound = result.requestId === requestId ? result : failure('VERIFICATION_FAILED', false);
    dispatch(verifiedNonceActions.verificationFinished({ accountKey, requestId, result: bound }));
});

type CancelAccountNonceVerificationThunkState = VerifiedNonceRootState;

type CancelAccountNonceVerificationThunkDeps = WithServices<
    DesktopApiDep<'cancelAccountNonceVerification'>
>;

export const cancelAccountNonceVerificationThunk = createThunk<
    void,
    { accountKey: AccountKey },
    {
        state: CancelAccountNonceVerificationThunkState;
        extra: CancelAccountNonceVerificationThunkDeps;
    }
>(`${actionPrefix}/cancelAccountNonceVerification`, async ({ accountKey }, { getState, extra }) => {
    const entry = selectVerifiedNonceEntry(getState(), accountKey);
    if (entry?.status !== 'running') return;
    // The pending verify call reports the outcome; a failed cancel has nothing else to do.
    await extra.services.desktopApi
        .cancelAccountNonceVerification({ requestId: entry.requestId })
        .catch(() => undefined);
});

type LoadVerifiedNonceInfoThunkDeps = WithServices<DesktopApiDep<'getVerifiedNonceInfo'>>;

export const loadVerifiedNonceInfoThunk = createThunk<
    void,
    void,
    { extra: LoadVerifiedNonceInfoThunkDeps }
>(`${actionPrefix}/loadVerifiedNonceInfo`, async (_, { dispatch, extra }) => {
    try {
        dispatch(
            verifiedNonceActions.setInfo(await extra.services.desktopApi.getVerifiedNonceInfo()),
        );
    } catch {
        dispatch(
            verifiedNonceActions.setInfo({
                isAvailable: false,
                runtime: 'unavailable',
                revision: '',
                trustPolicyId: null,
                unavailableCode: 'NATIVE_UNAVAILABLE',
            }),
        );
    }
});
