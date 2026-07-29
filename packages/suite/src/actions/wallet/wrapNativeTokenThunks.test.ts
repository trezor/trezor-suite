import { events } from '@suite-common/analytics';
import { configureMockStore } from '@suite-common/test-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type YieldFlowDisplayToken,
    accountsActions,
    stablecoinYieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';

import { PUSH_TRANSACTION_FAILED_CAUSE } from './stablecoin-yield/signingHelpers';
import { submitWrapNativeTokenThunk } from './wrapNativeTokenThunks';

const mockComposeYieldWrapTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();
const mockSendYieldTransaction = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldWrapTransactionThunk: (payload: unknown) =>
        mockComposeYieldWrapTransactionThunk(payload),
}));

jest.mock('@suite/modal', () => ({
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('./stablecoin-yield/signingHelpers', () => ({
    ...jest.requireActual('./stablecoin-yield/signingHelpers'),
    sendYieldTransaction: (payload: unknown) => mockSendYieldTransaction(payload),
    getYieldSubmitErrorAnalyticsMessage: jest.fn(() => 'submit-failed'),
}));

const account = mockWalletAccount({ symbol: 'eth' }) as Account;

const token: YieldFlowDisplayToken & { contractAddress: string } = {
    networkSymbol: 'eth',
    symbol: 'WETH',
    decimals: 18,
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
};

const buildStore = (report: jest.Mock) =>
    configureMockStore({
        extra: { services: { analytics: mockAnalytics(report) } },
        preloadedState: {},
    });

const dispatchWrap = (report: jest.Mock) =>
    buildStore(report)
        .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
        .unwrap();

describe('submitWrapNativeTokenThunk', () => {
    beforeAll(() => {
        // The thunk logs every caught failure; the expected ones would clutter the test output.
        jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () =>
                Promise.resolve({
                    type: 'action-ready',
                    unsignedTransaction: '{}',
                }),
        }));
        mockOpenDeferredModal.mockImplementation(() => () => Promise.resolve({ value: false }));
        mockSendYieldTransaction.mockResolvedValue(undefined);
    });

    it('uses the shared wrap composition from wallet-core', async () => {
        await dispatchWrap(jest.fn());

        expect(mockComposeYieldWrapTransactionThunk).toHaveBeenCalledWith({
            account,
            token,
            wrapAmount: '1',
        });
        expect(mockOpenDeferredModal).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'earn-yield-tx-simulation',
                data: expect.objectContaining({ flow: 'wrap' }),
            }),
        );
    });

    it('uses the parent yield flow identity when provided', async () => {
        const store = configureMockStore({ extra: {}, preloadedState: {} });
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xwrap' });

        await store
            .dispatch(
                submitWrapNativeTokenThunk({
                    account,
                    token,
                    wrapAmount: '1',
                    yieldFlow: {
                        flowKey: 'yield-flow',
                        flowType: 'deposit',
                    },
                }),
            )
            .unwrap();

        expect(mockSendYieldTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                flowKey: 'yield-flow',
                flowType: 'deposit',
            }),
        );
    });

    const getTrackedTokenUpdates = (store: ReturnType<typeof configureMockStore>) =>
        store
            .getActions()
            .filter(action => action.type === accountsActions.updateAccount.type)
            .filter(action =>
                action.payload.tokens?.some(
                    (accountToken: { contract: string }) =>
                        accountToken.contract.toLowerCase() === token.contractAddress.toLowerCase(),
                ),
            );

    const acceptModalAndSucceed = () => {
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue({ txid: '0xwrap' });
    };

    it('shows a wrap toast displaying both the native and wrapped assets', async () => {
        acceptModalAndSucceed();
        const store = buildStore(jest.fn());

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1.5' }))
            .unwrap();

        const wrapToast = store.getActions().find(action => action.payload?.type === 'tx-wrap');

        expect(wrapToast?.payload).toMatchObject({
            type: 'tx-wrap',
            txid: '0xwrap',
            metadata: {
                send: {
                    symbol: account.symbol,
                    displaySymbol: getNetworkDisplaySymbol(account.symbol),
                    amount: '1.5',
                },
                receive: {
                    symbol: account.symbol,
                    displaySymbol: token.symbol,
                    contractAddress: token.contractAddress,
                    amount: '1.5',
                },
            },
        });
    });

    it('starts tracking the wrapped native token after a successful wrap', async () => {
        acceptModalAndSucceed();
        const store = buildStore(jest.fn());

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
            .unwrap();

        const trackedTokenUpdates = getTrackedTokenUpdates(store);
        expect(trackedTokenUpdates).toHaveLength(1);
    });

    it('does not track the wrapped native token when it is already tracked', async () => {
        acceptModalAndSucceed();
        const accountWithTrackedToken = mockWalletAccount({
            symbol: 'eth',
            tokens: [
                {
                    standard: 'ERC20',
                    // stored in a different case to prove the dedupe is case-insensitive
                    contract: token.contractAddress.toLowerCase(),
                    symbol: 'WETH',
                    decimals: 18,
                },
            ],
        }) as Account;
        const store = buildStore(jest.fn());

        await store
            .dispatch(
                submitWrapNativeTokenThunk({
                    account: accountWithTrackedToken,
                    token,
                    wrapAmount: '1',
                }),
            )
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(0);
    });

    it('does not track the wrapped native token when the send fails', async () => {
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendYieldTransaction.mockResolvedValue(undefined);
        const store = buildStore(jest.fn());

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
            .unwrap();

        expect(getTrackedTokenUpdates(store)).toHaveLength(0);
    });

    describe('failure reporting', () => {
        const yieldFlow = { flowKey: 'yield-flow', flowType: 'deposit' } as const;

        const acceptModalAndFailWith = (error: Error) => {
            mockOpenDeferredModal.mockImplementation(
                () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
            );
            mockSendYieldTransaction.mockRejectedValue(error);
        };

        const getFlowErrors = (store: ReturnType<typeof configureMockStore>) =>
            store
                .getActions()
                .filter(action => action.type === stablecoinYieldActions.setError.type);

        it('reports a push failure on the deposit step it was started from', async () => {
            acceptModalAndFailWith(
                new Error('push failed', { cause: PUSH_TRANSACTION_FAILED_CAUSE }),
            );
            const store = configureMockStore({ extra: {}, preloadedState: {} });

            await store
                .dispatch(
                    submitWrapNativeTokenThunk({ account, token, wrapAmount: '1', yieldFlow }),
                )
                .unwrap();

            expect(getFlowErrors(store)[0]?.payload).toMatchObject({
                ...yieldFlow,
                error: 'TR_EARN_YIELD_ERROR_PUSH_FAILED',
            });
        });

        it('falls back to the generic error for an unrecognised failure', async () => {
            acceptModalAndFailWith(new Error('boom'));
            const store = configureMockStore({ extra: {}, preloadedState: {} });

            await store
                .dispatch(
                    submitWrapNativeTokenThunk({ account, token, wrapAmount: '1', yieldFlow }),
                )
                .unwrap();

            expect(getFlowErrors(store)[0]?.payload).toMatchObject({
                error: 'TR_EARN_YIELD_ERROR_GENERIC',
            });
        });

        it('still shows the signing toast, the only feedback a standalone wrap gets', async () => {
            acceptModalAndFailWith(new Error('boom'));
            const store = configureMockStore({ extra: {}, preloadedState: {} });

            await store
                .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
                .unwrap();

            const signErrorToast = store
                .getActions()
                .find(action => action.payload?.type === 'sign-tx-error');

            expect(signErrorToast?.payload).toMatchObject({ error: 'boom' });
        });

        it('does not report a flow error for a standalone wrap', async () => {
            acceptModalAndFailWith(new Error('boom'));
            const store = configureMockStore({ extra: {}, preloadedState: {} });

            await store
                .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
                .unwrap();

            expect(getFlowErrors(store)).toHaveLength(0);
        });

        it('reports a compose failure on the deposit step it was started from', async () => {
            mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
                unwrap: () => Promise.resolve({ type: 'error', reason: 'fee-estimation-failed' }),
            }));
            const store = configureMockStore({ extra: {}, preloadedState: {} });

            await store
                .dispatch(
                    submitWrapNativeTokenThunk({ account, token, wrapAmount: '1', yieldFlow }),
                )
                .unwrap();

            expect(getFlowErrors(store)[0]?.payload).toMatchObject({
                ...yieldFlow,
                error: 'TR_EARN_YIELD_ERROR_GENERIC',
            });
        });
    });

    it('does not report standalone wrap analytics for the in-flow deposit step', async () => {
        const report = jest.fn();
        acceptModalAndSucceed();

        await buildStore(report)
            .dispatch(
                submitWrapNativeTokenThunk({
                    account,
                    token,
                    wrapAmount: '1',
                    yieldFlow: { flowKey: 'yield-flow', flowType: 'deposit' },
                }),
            )
            .unwrap();

        expect(report).not.toHaveBeenCalledWith(
            expect.objectContaining({ type: events.yieldWrapEvent.name }),
        );
    });

    it('reports the tx-simulation-modal cancel', async () => {
        const report = jest.fn();

        await dispatchWrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
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
        mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () => Promise.resolve({ type: 'error', reason: 'unsupported-network' }),
        }));

        await dispatchWrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
                payload: expect.objectContaining({
                    type: 'error',
                    errorMessage: 'unsupported-network',
                }),
            }),
        );
    });

    it('reports tx-simulation-modal continue and submit-failed when the tx is not broadcast', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn(), selectedFee: null }),
        );

        await dispatchWrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
                payload: expect.objectContaining({
                    type: 'tx-simulation-modal',
                    action: 'continue',
                }),
            }),
        );
        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
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

        await dispatchWrap(report);

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                type: events.yieldWrapEvent.name,
                payload: expect.objectContaining({
                    type: 'sent',
                    action: 'continue',
                    networkSymbol: 'eth',
                }),
            }),
        );
    });
});
