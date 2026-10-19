import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { closeModal } from '@suite/modal';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockMigrateSuiteSyncLabelsForRbfTransaction } from '@suite-common/suite-rbf-labels-migrations-types/mocks';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { mockGetIsWindowVisible } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type SignTransactionError,
    type SignTransactionTimeoutError,
} from '@suite-common/wallet-core';
import { type FormState, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockGetTradedAccountKeys, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { createMockDispatch } from '@trezor/redux-utils/mocks';

import {
    type SignAndPushSendFormTransactionThunkDeps,
    type SignAndPushSendFormTransactionThunkState,
    signAndPushSendFormTransactionThunk,
} from './sendFormThunks';

const mockEnhanceTransaction = jest.fn();
const mockSignTransaction = jest.fn();
const mockOpenReview = jest.fn();
let mockIsYieldTransaction = true;

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectSelectedDevice: () => ({ path: 'test-device' }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectIsYieldTransactionInReview: () => mockIsYieldTransaction,
    enhancePrecomposedTransactionThunk: () => mockEnhanceTransaction(),
    signTransactionThunk: () => mockSignTransaction(),
}));
jest.mock('@suite/modal', () => ({
    ...jest.requireActual('@suite/modal'),
    openDeferredModal: () => mockOpenReview(),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const formState: FormState = {
    outputs: [],
    options: ['broadcast'],
    selectedFee: 'normal',
    feePerUnit: '1',
    feeLimit: '21000',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
};
const precomposedTransaction: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [],
    outputs: [],
    fee: '0',
    totalSpent: '0',
    feePerByte: '1',
    bytes: 1,
    outputsPermutation: [],
};
const analytics = mockDesktopAnalytics();

const send = async () => {
    const getState = mock<() => SignAndPushSendFormTransactionThunkState>();
    const extra: SignAndPushSendFormTransactionThunkDeps = {
        actions: { onModalCancel: closeModal },
        services: {
            analytics,
            suiteSync: mockSuiteSync(),
            migrateSuiteSyncLabelsForRbfTransaction: mockMigrateSuiteSyncLabelsForRbfTransaction(),
            getIsWindowVisible: mockGetIsWindowVisible(),
            getTradedAccountKeys: mockGetTradedAccountKeys(),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
        },
    };
    const { dispatch } = createMockDispatch({ getState, extra });

    await signAndPushSendFormTransactionThunk({
        selectedAccount: account,
        formState,
        precomposedTransaction,
    })(dispatch, getState, extra).unwrap();
};

const rejectedSign = (payload: SignTransactionError | SignTransactionTimeoutError) => () =>
    Promise.resolve({
        type: 'test/sign/rejected',
        payload,
        meta: { requestStatus: 'rejected', requestId: 'test-sign' },
    });
const cancelEvents = () =>
    jest
        .mocked(analytics.report)
        .mock.calls.map(([event]) => event)
        .filter(event => event.type === 'transaction/cancel');

describe('Earn allowance cancellation in the shared Send flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsYieldTransaction = true;
        mockEnhanceTransaction.mockImplementation(() => () => {
            const result = Promise.resolve(precomposedTransaction);

            return Object.assign(result, { unwrap: () => result });
        });
        mockSignTransaction.mockImplementation(
            () => () =>
                Promise.resolve({
                    type: 'test/sign/fulfilled',
                    payload: { serializedTx: 'signed' },
                    meta: { requestStatus: 'fulfilled', requestId: 'test-sign' },
                }),
        );
        mockOpenReview.mockImplementation(() => () => Promise.resolve(false));
    });

    it('reports one cancellation when a signed Earn approval or revoke review is closed', async () => {
        await send();
        expect(cancelEvents()).toEqual([
            {
                type: 'transaction/cancel',
                payload: { txType: 'yield', networkSymbol: 'eth', stage: 'review' },
            },
        ]);
    });

    it.each(['Failure_ActionCancelled', 'Failure_PinCancelled', 'Method_Cancel'] as const)(
        'reports signing cancellation for Earn allowance %s',
        async errorCode => {
            mockSignTransaction.mockImplementation(() =>
                rejectedSign({
                    error: 'sign-transaction-failed',
                    errorCode,
                    message: 'cancelled',
                }),
            );
            await send();
            expect(cancelEvents()).toEqual([
                {
                    type: 'transaction/cancel',
                    payload: { txType: 'yield', networkSymbol: 'eth', stage: 'signing' },
                },
            ]);
            expect(mockOpenReview).not.toHaveBeenCalled();
        },
    );

    it.each([
        { error: 'sign-transaction-failed', errorCode: 'Failure_FirmwareError', message: 'failed' },
        {
            error: 'sign-transaction-timeout',
            errorCode: 'Method_Cancel',
            message: 'Signing process timed out.',
        },
    ] as const)('does not report signing failure/expiry as cancellation: $error', async error => {
        mockSignTransaction.mockImplementation(() => rejectedSign(error));
        await send();
        expect(cancelEvents()).toEqual([]);
        expect(mockOpenReview).not.toHaveBeenCalled();
    });

    it('does not classify a regular Send review cancellation as Earn', async () => {
        mockIsYieldTransaction = false;
        await send();
        expect(cancelEvents()).toEqual([]);
    });

    it('does not classify a regular Send signing rejection as Earn', async () => {
        mockIsYieldTransaction = false;
        mockSignTransaction.mockImplementation(() =>
            rejectedSign({
                error: 'sign-transaction-failed',
                errorCode: 'Failure_ActionCancelled',
                message: 'cancelled',
            }),
        );
        await send();
        expect(cancelEvents()).toEqual([]);
    });
});
