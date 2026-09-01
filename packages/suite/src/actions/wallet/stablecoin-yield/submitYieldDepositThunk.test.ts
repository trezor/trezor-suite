import { type DesktopAnalyticsDep } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { asGetter } from '@suite-common/dependency-injection';
import { createTestStore } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type YieldFlowResolvedData, yieldActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { type SendYieldTransactionDeps } from './signingHelpers';
import { submitYieldDepositThunk } from './submitYieldDepositThunk';

const mockComposeYieldDepositTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();
const mockSendYieldTransaction = jest.fn();

const mockSentResult = (txid: string) => ({ status: 'sent' as const, txid });
const mockCancelledResult = { status: 'cancelled' as const };

type SubmitYieldDepositThunkDeps = SendYieldTransactionDeps & { services: DesktopAnalyticsDep };

const createExtra = (report: jest.Mock = jest.fn()): SubmitYieldDepositThunkDeps => ({
    services: {
        analytics: mockAnalytics(report),
        getIsWindowVisible: asGetter(() => true),
        getTradedAccountKeys: asGetter(() => []),
    },
});

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldDepositTransactionThunk: (payload: unknown) =>
        mockComposeYieldDepositTransactionThunk(payload),
}));

jest.mock('@suite/modal', () => ({
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('./signingHelpers', () => ({
    ...jest.requireActual('./signingHelpers'),
    sendYieldTransaction: (payload: unknown) => mockSendYieldTransaction(payload),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') }) as Account;

const flowData = {
    account,
    vault: { id: 'vault-1' },
    token: {
        networkSymbol: 'eth',
        symbol: 'usdc',
        decimals: 6,
        contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        balance: '100',
    },
    receiptToken: {
        networkSymbol: 'eth',
        symbol: 'musdc',
        decimals: 18,
        contractAddress: '0xd63070114470f685b75B74D60EEc7c1113d33a3D',
    },
} as unknown as YieldFlowResolvedData;

const dispatchDeposit = (report: jest.Mock) => {
    const store = createTestStore({ extra: createExtra(report), preloadedState: {} });

    return store
        .dispatch(submitYieldDepositThunk({ flowKey: 'flow-1', flowData, amount: '100' }))
        .unwrap()
        .then(() => store);
};

describe('submitYieldDepositThunk', () => {
    beforeAll(() => {
        // The thunk logs every caught failure; the expected ones would clutter the test output.
        jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockComposeYieldDepositTransactionThunk.mockImplementation(() => () => ({
            unwrap: () =>
                Promise.resolve({
                    type: 'action-ready',
                    unsignedTransaction: '{}',
                    receiptAmount: '99',
                }),
        }));
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
        );
        mockSendYieldTransaction.mockResolvedValue(mockSentResult('0xdeposit'));
    });

    it('does not report an error when the user cancels the signing', async () => {
        const report = jest.fn();
        mockSendYieldTransaction.mockResolvedValue(mockCancelledResult);

        const store = await dispatchDeposit(report);

        expect(report).not.toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ type: 'error' }),
            }),
        );
        expect(
            store.getActions().filter(action => action.type === yieldActions.setError.type),
        ).toHaveLength(0);
        expect(
            store.getActions().filter(action => action.type === yieldActions.setPendingTx.type),
        ).toHaveLength(0);
    });

    it('stores the broadcast transaction as pending', async () => {
        const store = await dispatchDeposit(jest.fn());

        const pendingTxAction = store
            .getActions()
            .find(action => action.type === yieldActions.setPendingTx.type);

        expect(pendingTxAction?.payload).toMatchObject({
            flowType: 'deposit',
            flowKey: 'flow-1',
            receiptAmount: '99',
            tx: {
                type: 'deposit',
                txid: '0xdeposit',
                amount: '100',
            },
        });

        const toast = store
            .getActions()
            .filter(notificationsActions.addToast.match)
            .find(action => action.payload.type === 'tx-yield-deposit');
        expect(toast?.payload).toMatchObject({ txid: '0xdeposit' });
    });

    it('still reports submit-failed when the signing throws', async () => {
        const report = jest.fn();
        mockSendYieldTransaction.mockRejectedValue(new Error('boom'));

        const store = await dispatchDeposit(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldDepositEvent.name,
                payload: expect.objectContaining({
                    type: 'error',
                    errorMessage: 'submit-failed',
                }),
            }),
        );
        expect(
            store.getActions().find(action => action.type === yieldActions.setError.type)?.payload,
        ).toMatchObject({ error: 'TR_EARN_YIELD_ERROR_GENERIC' });
    });
});
