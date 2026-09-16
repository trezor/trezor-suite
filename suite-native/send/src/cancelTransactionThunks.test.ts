import { createAction, isFulfilled, isRejected } from '@reduxjs/toolkit';

import { asGetter } from '@suite-common/dependency-injection';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type PushSendFormTransactionThunkDeps,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import {
    type FormState,
    type PrecomposedTransactionFinalCancelRbf,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';

import { signAndPushEvmCancelTransactionThunk } from './cancelTransactionThunks';
import { cleanupSendFormThunk, signTransactionNativeThunk } from './sendFormThunks';

jest.mock('@suite-common/mev', () => ({
    __esModule: true,
    selectIsMevProtectionFeatureEnabled: jest.fn(),
}));

jest.mock('@suite-common/wallet-core', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/wallet-core'),
    pushSendFormTransactionThunk: jest.fn(),
    selectAccountByKey: jest.fn(),
    selectIsMevProtectionEnabled: jest.fn(),
}));

jest.mock('./sendFormThunks', () => ({
    __esModule: true,
    signTransactionNativeThunk: jest.fn(),
    cleanupSendFormThunk: jest.fn(() => ({ type: 'mock/cleanupSendForm' })),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const { key: accountKey } = account;

// Opaque pass-through values: the thunk only forwards these to the (mocked) sign/store/cleanup
// pipeline, so a minimal shape is enough here.
const composedCancelTx = {
    type: 'final',
    rbfType: 'cancel',
    prevTxid: '0xoriginaltxid',
} as unknown as PrecomposedTransactionFinalCancelRbf;
const cancelFormState = { outputs: [] } as unknown as FormState;

const pushResultPayload = { success: true, payload: { txid: '0xcancelledtxid' } };

// signTransactionNativeThunk / pushSendFormTransactionThunk are mocked to return already-settled
// RTK-style action objects; isRejected/isFulfilled require both meta.requestId and requestStatus.
const fulfilledAction = (payload?: unknown) => ({
    type: 'mock/fulfilled',
    payload,
    meta: { requestId: 'mock-request-id', requestStatus: 'fulfilled' as const },
});
const rejectedAction = (payload?: unknown) => ({
    type: 'mock/rejected',
    payload,
    meta: { requestId: 'mock-request-id', requestStatus: 'rejected' as const },
});

const signMock = signTransactionNativeThunk as unknown as jest.Mock;
const pushMock = pushSendFormTransactionThunk as unknown as jest.Mock;
const cleanupMock = cleanupSendFormThunk as unknown as jest.Mock;
const selectAccountByKeyMock = selectAccountByKey as unknown as jest.Mock;
const mevEnabledMock = selectIsMevProtectionEnabled as unknown as jest.Mock;
const mevFeatureMock = selectIsMevProtectionFeatureEnabled as unknown as jest.Mock;
const extra: PushSendFormTransactionThunkDeps = {
    actions: { onModalCancel: createAction<void>('test/onModalCancel') },
    services: {
        analytics: mockNativeAnalytics(),
        getIsWindowVisible: asGetter(() => true),
        getTradedAccountKeys: asGetter(() => []),
    },
};

const dispatchCancel = () =>
    createTestStore({ extra }).dispatch(
        signAndPushEvmCancelTransactionThunk({ accountKey, composedCancelTx, cancelFormState }),
    );

describe('signAndPushEvmCancelTransactionThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        selectAccountByKeyMock.mockReturnValue(account);
        signMock.mockReturnValue(fulfilledAction());
        pushMock.mockReturnValue(fulfilledAction(pushResultPayload));
        mevEnabledMock.mockReturnValue(false);
        mevFeatureMock.mockReturnValue(false);
    });

    it('rejects with "Account not found" and never touches the send pipeline when the account is missing', async () => {
        selectAccountByKeyMock.mockReturnValue(undefined);

        const result = await dispatchCancel();

        expect(isRejected(result)).toBe(true);
        expect(result.payload).toEqual({
            error: 'sign-transaction-failed',
            message: 'Account not found.',
        });
        // The guard returns before the try/finally, so nothing (not even cleanup) should run.
        expect(signMock).not.toHaveBeenCalled();
        expect(cleanupMock).not.toHaveBeenCalled();
    });

    it('signs with the cancel form state, pushes and cleans up on success', async () => {
        const result = await dispatchCancel();

        expect(isFulfilled(result)).toBe(true);
        expect(result.payload).toEqual(pushResultPayload);

        expect(signMock).toHaveBeenCalledWith({
            accountKey,
            feeLevel: composedCancelTx,
            formState: cancelFormState,
        });
        expect(pushMock).toHaveBeenCalledWith({
            selectedAccount: account,
            isMevProtectionEnabled: false,
        });
        expect(cleanupMock).toHaveBeenCalledWith({ accountKey, shouldDeleteDraft: false });
    });

    it('propagates a signing failure, skips the push and still cleans up', async () => {
        const signError = { error: 'sign-transaction-failed', message: 'device disconnected' };
        signMock.mockReturnValue(rejectedAction(signError));

        const result = await dispatchCancel();

        expect(isRejected(result)).toBe(true);
        expect(result.payload).toEqual(signError);
        expect(pushMock).not.toHaveBeenCalled();
        expect(cleanupMock).toHaveBeenCalledWith({ accountKey, shouldDeleteDraft: false });
    });

    it('propagates a push failure and still cleans up', async () => {
        const pushError = { error: 'push-transaction-failed', message: 'mempool rejected' };
        pushMock.mockReturnValue(rejectedAction(pushError));

        const result = await dispatchCancel();

        expect(isRejected(result)).toBe(true);
        expect(result.payload).toEqual(pushError);
        expect(cleanupMock).toHaveBeenCalledWith({ accountKey, shouldDeleteDraft: false });
    });

    it('enables MEV protection only when both the user setting and the feature flag are on', async () => {
        mevEnabledMock.mockReturnValue(true);
        mevFeatureMock.mockReturnValue(true);
        await dispatchCancel();
        expect(pushMock).toHaveBeenLastCalledWith({
            selectedAccount: account,
            isMevProtectionEnabled: true,
        });

        // Feature flag off overrides the user setting.
        mevFeatureMock.mockReturnValue(false);
        await dispatchCancel();
        expect(pushMock).toHaveBeenLastCalledWith({
            selectedAccount: account,
            isMevProtectionEnabled: false,
        });
    });
});
