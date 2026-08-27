import { type AnalyticsDep, events } from '@suite-common/analytics';
import { asGetter } from '@suite-common/dependency-injection';
import { type WithServices } from '@suite-common/redux-utils';
import { configureMockStore } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asNetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { type SendYieldTransactionDeps } from './stablecoin-yield/signingHelpers';
import { submitUnwrapNativeTokenThunk } from './unwrapNativeTokenThunks';

const mockComposeYieldUnwrapTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();
const mockSendYieldTransaction = jest.fn();

type UnwrapNativeTokenThunkDeps = SendYieldTransactionDeps & WithServices<AnalyticsDep>;

const createExtra = (report: jest.Mock = jest.fn()): UnwrapNativeTokenThunkDeps => ({
    services: {
        analytics: mockAnalytics(report),
        getIsWindowVisible: asGetter(() => true),
        getTradedAccountKeys: asGetter(() => []),
    },
});

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldUnwrapTransactionThunk: (payload: unknown) =>
        mockComposeYieldUnwrapTransactionThunk(payload),
}));

jest.mock('@suite/modal', () => ({
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('./stablecoin-yield/signingHelpers', () => ({
    sendYieldTransaction: (payload: unknown) => mockSendYieldTransaction(payload),
    getYieldSubmitErrorAnalyticsMessage: jest.fn(() => 'submit-failed'),
}));

const ethSymbol = asNetworkSymbol('eth');
const account = mockWalletAccount({ symbol: ethSymbol }) as Account;

const token: YieldFlowDisplayToken & { contractAddress: string } = {
    networkSymbol: ethSymbol,
    symbol: 'WETH',
    decimals: 18,
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
};

const buildStore = (report: jest.Mock) =>
    configureMockStore({
        extra: createExtra(report),
        preloadedState: {},
    });

const dispatchUnwrap = (report: jest.Mock) =>
    buildStore(report)
        .dispatch(submitUnwrapNativeTokenThunk({ account, token, unwrapAmount: '1' }))
        .unwrap();

describe('submitUnwrapNativeTokenThunk', () => {
    beforeAll(() => {
        // The thunk logs every caught failure; the expected ones would clutter the test output.
        jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockComposeYieldUnwrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () =>
                Promise.resolve({
                    type: 'action-ready',
                    unsignedTransaction: '{}',
                }),
        }));
        mockOpenDeferredModal.mockImplementation(() => () => Promise.resolve({ value: false }));
        mockSendYieldTransaction.mockResolvedValue(undefined);
    });

    it('uses the shared unwrap composition from wallet-core', async () => {
        await dispatchUnwrap(jest.fn());

        expect(mockComposeYieldUnwrapTransactionThunk).toHaveBeenCalledWith({
            account,
            token,
            unwrapAmount: '1',
        });
        expect(mockOpenDeferredModal).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'earn-yield-tx-simulation',
                data: expect.objectContaining({ flow: 'unwrap' }),
            }),
        );
    });

    it('uses the parent yield flow identity when provided', async () => {
        const store = configureMockStore({ extra: createExtra(), preloadedState: {} });
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xunwrap' });

        await store
            .dispatch(
                submitUnwrapNativeTokenThunk({
                    account,
                    token,
                    unwrapAmount: '1',
                    yieldFlow: {
                        flowKey: 'yield-flow',
                        flowType: 'redeem',
                    },
                }),
            )
            .unwrap();

        expect(mockSendYieldTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                flowKey: 'yield-flow',
                flowType: 'redeem',
            }),
        );
    });

    it('shows an unwrap toast displaying both the wrapped and native assets', async () => {
        const store = buildStore(jest.fn());
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xunwrap' });

        await store
            .dispatch(submitUnwrapNativeTokenThunk({ account, token, unwrapAmount: '1.5' }))
            .unwrap();

        const unwrapToast = store
            .getActions()
            .filter(notificationsActions.addToast.match)
            .find(action => action.payload.type === 'tx-unwrap');

        expect(unwrapToast?.payload).toMatchObject({
            type: 'tx-unwrap',
            txid: '0xunwrap',
            metadata: {
                send: {
                    symbol: account.symbol,
                    displaySymbol: token.symbol,
                    contractAddress: token.contractAddress,
                    amount: '1.5',
                },
                receive: {
                    symbol: account.symbol,
                    displaySymbol: getNetworkDisplaySymbol(account.symbol),
                    amount: '1.5',
                },
            },
        });
    });

    it('does not report standalone unwrap analytics for the in-flow withdraw step', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xunwrap' });

        await buildStore(report)
            .dispatch(
                submitUnwrapNativeTokenThunk({
                    account,
                    token,
                    unwrapAmount: '1',
                    yieldFlow: { flowKey: 'yield-flow', flowType: 'redeem' },
                }),
            )
            .unwrap();

        expect(report).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: events.yieldUnwrapEvent.name }),
        );
    });

    describe('in-flow failure analytics', () => {
        const yieldFlow = {
            flowKey: 'yield-flow',
            flowType: 'redeem',
            vaultId: 'vault-1',
        } as const;

        const dispatchInFlowUnwrap = (report: jest.Mock) =>
            buildStore(report)
                .dispatch(
                    submitUnwrapNativeTokenThunk({
                        account,
                        token,
                        unwrapAmount: '1',
                        yieldFlow,
                    }),
                )
                .unwrap();

        const expectWithdrawError = (report: jest.Mock, errorMessage: string) => {
            expect(report).toHaveBeenCalledWith({
                type: events.yieldWithdrawEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    operation: 'redeem',
                    networkSymbol: 'eth',
                    vaultId: 'vault-1',
                    errorMessage,
                },
            });
            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: events.yieldUnwrapEvent.name }),
            );
        };

        it('reports a compose failure on the withdraw event', async () => {
            const report = jest.fn();
            mockComposeYieldUnwrapTransactionThunk.mockImplementation(() => () => ({
                unwrap: () => Promise.resolve({ type: 'error', reason: 'fee-estimation-failed' }),
            }));

            await dispatchInFlowUnwrap(report);

            expectWithdrawError(report, 'unwrap-fee-estimation-failed');
        });

        it('reports a device rejection on the withdraw event', async () => {
            const report = jest.fn();
            mockOpenDeferredModal.mockImplementation(
                () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
            );
            mockSendYieldTransaction.mockResolvedValue(undefined);

            await dispatchInFlowUnwrap(report);

            expectWithdrawError(report, 'unwrap-submit-failed');
        });

        it('reports a thrown signing failure on the withdraw event', async () => {
            const report = jest.fn();
            mockOpenDeferredModal.mockImplementation(
                () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
            );
            mockSendYieldTransaction.mockRejectedValue(new Error('boom'));

            await dispatchInFlowUnwrap(report);

            expectWithdrawError(report, 'unwrap-submit-failed');
        });

        it('reports no withdraw error once the unwrap is broadcast', async () => {
            const report = jest.fn();
            mockOpenDeferredModal.mockImplementation(
                () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
            );
            mockSendYieldTransaction.mockResolvedValue({ txid: '0xunwrap' });

            await dispatchInFlowUnwrap(report);

            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: events.yieldWithdrawEvent.name }),
            );
        });
    });

    it('reports the tx-simulation-modal cancel', async () => {
        const report = jest.fn();

        await dispatchUnwrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldUnwrapEvent.name,
                payload: expect.objectContaining({
                    type: 'tx-simulation-modal',
                    action: 'cancel',
                    networkSymbol: 'eth',
                }),
            }),
        );
    });

    it('reports an error carrying the compose reason when composition fails', async () => {
        const report = jest.fn();
        mockComposeYieldUnwrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () => Promise.resolve({ type: 'error', reason: 'fee-estimation-failed' }),
        }));

        await dispatchUnwrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldUnwrapEvent.name,
                payload: expect.objectContaining({
                    type: 'error',
                    errorMessage: 'fee-estimation-failed',
                }),
            }),
        );
    });

    it('reports tx-simulation-modal continue and submit-failed when the tx is not broadcast', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
        );

        await dispatchUnwrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldUnwrapEvent.name,
                payload: expect.objectContaining({
                    type: 'tx-simulation-modal',
                    action: 'continue',
                }),
            }),
        );
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldUnwrapEvent.name,
                payload: expect.objectContaining({
                    type: 'error',
                    errorMessage: 'submit-failed',
                }),
            }),
        );
    });

    it('reports the sent event when the transaction is broadcast', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xabc' });

        await dispatchUnwrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldUnwrapEvent.name,
                payload: expect.objectContaining({
                    type: 'sent',
                    action: 'continue',
                    networkSymbol: 'eth',
                }),
            }),
        );
    });
});
