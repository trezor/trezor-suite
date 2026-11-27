import { type AnalyticsDep, events } from '@suite-common/analytics';
import { deviceActions, deviceInitialState } from '@suite-common/device';
import { mockGetAccountSyncInterval } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type TestCompositionStore, createTestCompositionRoot } from '@suite-common/test-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { asNetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type ComposeYieldWrapTransactionThunkState,
    type YieldFlowDisplayToken,
    accountsActions,
    transactionsActions,
    yieldActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import { ERRORS } from '@trezor/connect-common';
import { asGetter } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';
import { createDeferred } from '@trezor/utils';

import {
    PUSH_TRANSACTION_FAILED_CAUSE,
    type SendEvmTransactionDeps,
    type SendEvmTransactionState,
} from './evmTransaction';
import { submitWrapNativeTokenThunk } from './wrapNativeTokenThunks';

const ethSymbol = asNetworkSymbol('eth');

const mockComposeYieldWrapTransactionThunk = jest.fn();
const mockOpenDeferredModal = jest.fn();
const mockSendEvmTokenTransaction = jest.fn();

const mockSentResult = (txid: string) => ({ status: 'sent' as const, txid, fee: '31500000000' });
const mockCancelledResult = { status: 'cancelled' as const, stage: 'signing' as const };

type WrapNativeTokenThunkDeps = SendEvmTransactionDeps & WithServices<AnalyticsDep>;
type WrapNativeTokenThunkState = ComposeYieldWrapTransactionThunkState & SendEvmTransactionState;
type WrapNativeTokenTestStore = TestCompositionStore<
    WrapNativeTokenThunkState,
    WrapNativeTokenThunkDeps
>;

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeYieldWrapTransactionThunk: (payload: unknown) =>
        mockComposeYieldWrapTransactionThunk(payload),
}));

jest.mock('@suite/modal', () => ({
    openDeferredModal: (payload: unknown) => mockOpenDeferredModal(payload),
}));

jest.mock('./evmTransaction', () => ({
    ...jest.requireActual('./evmTransaction'),
    sendEvmTokenTransaction: (payload: unknown) => mockSendEvmTokenTransaction(payload),
}));

jest.mock('./stablecoin-yield/signingHelpers', () => ({
    ...jest.requireActual('./stablecoin-yield/signingHelpers'),
    getYieldSubmitErrorAnalyticsMessage: jest.fn(() => 'submit-failed'),
}));

const account = mockWalletAccount({ symbol: ethSymbol }) as Account;

const token: YieldFlowDisplayToken & { contractAddress: string } = {
    networkSymbol: ethSymbol,
    symbol: 'WETH',
    decimals: 18,
    contractAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
};

const owner = mockSuiteDevice({
    connected: true,
    available: true,
    path: 'owner',
    instance: 0,
    state: { staticSessionId: account.deviceState },
});

const DEVICE_DISCONNECTED = ERRORS.ERROR_CODES.Device_Disconnected;

const buildStore = (report: jest.Mock) =>
    createTestCompositionRoot<WrapNativeTokenThunkDeps, WrapNativeTokenThunkState>({
        preloadedState: { device: { ...deviceInitialState, selectedDevice: owner } },
        services: () => ({
            analytics: mockAnalytics(report),
            networks: { getAccountSyncInterval: mockGetAccountSyncInterval() },
            getIsWindowVisible: asGetter(() => true),
            getTradedAccountKeys: asGetter(() => []),
        }),
    }).services.store;

const dispatchWrap = async (report: jest.Mock) => {
    const store = buildStore(report);
    await store.dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' })).unwrap();

    return store;
};

describe('submitWrapNativeTokenThunk', () => {
    it('reports an unexpected compose failure without exposing its message', async () => {
        const report = jest.fn();
        mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
            unwrap: () => Promise.reject(new Error('private-compose-details')),
        }));

        await dispatchWrap(report);

        expect(report).toHaveBeenCalledWith({
            type: 'yield/wrap',
            payload: expect.objectContaining({
                type: 'error',
                errorMessage: 'submit-failed',
            }),
        });
        expect(JSON.stringify(report.mock.calls)).not.toContain('private-compose-details');
    });

    it.each([
        ['no original owner', undefined, owner, DEVICE_DISCONNECTED],
        ['disconnected', owner, undefined, DEVICE_DISCONNECTED],
        ['unavailable', owner, { ...owner, available: false }, DEVICE_DISCONNECTED],
        [
            'reconnected on a new path',
            owner,
            mockSuiteDevice({
                connected: true,
                available: true,
                path: 'new-path',
                instance: 0,
                state: owner.state,
            }),
            DEVICE_DISCONNECTED,
        ],
        [
            'replaced by another wallet',
            owner,
            mockSuiteDevice({ connected: true, available: true, path: 'new-path' }),
            'Wallet_Mismatch',
        ],
        ['switched wallet instance', owner, { ...owner, instance: 1 }, DEVICE_DISCONNECTED],
    ] as const)(
        'reports a device error instead of a cancelled simulation if the owner is %s during composition',
        async (_, initial, current, expectedError) => {
            const report = jest.fn();
            const store = buildStore(report);
            const initialState = store.getState();
            store.replaceReducer((state = initialState, action) =>
                deviceActions.selectDevice.match(action)
                    ? { ...state, device: { ...state.device, selectedDevice: action.payload } }
                    : state,
            );
            store.dispatch(deviceActions.selectDevice(initial));
            const composition = createDeferred<{
                type: 'action-ready';
                unsignedTransaction: string;
            }>();
            mockComposeYieldWrapTransactionThunk.mockReturnValue(() => ({
                unwrap: () => composition.promise,
            }));

            const submit = store.dispatch(
                submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }),
            );
            store.dispatch(deviceActions.selectDevice(current));
            composition.resolve({ type: 'action-ready', unsignedTransaction: '{}' });
            await submit.unwrap();

            expect(mockOpenDeferredModal).not.toHaveBeenCalled();
            expect(mockSendEvmTokenTransaction).not.toHaveBeenCalled();
            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ type: 'tx-simulation-modal' }),
                }),
            );
            expect(store.getActions()).toContainEqual(
                expect.objectContaining({
                    type: notificationsActions.addToast.type,
                    payload: expect.objectContaining({
                        type: 'sign-tx-error',
                        error: expectedError,
                    }),
                }),
            );
        },
    );

    it('passes the selected fee level from simulation to signing', async () => {
        mockOpenDeferredModal.mockImplementation(
            () => () =>
                Promise.resolve({
                    value: true,
                    resolve: jest.fn(),
                    selectedFee: null,
                    selectedFeeLevel: 'low',
                }),
        );

        await dispatchWrap(jest.fn());

        expect(mockSendEvmTokenTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                txType: 'yield',
                yieldFlow: undefined,
                simulation: expect.objectContaining({ selectedFee: null, selectedFeeLevel: 'low' }),
            }),
        );
    });

    it.each(['signing', 'review'] as const)('reports a cancellation at %s', async stage => {
        const report = jest.fn();
        mockSendEvmTokenTransaction.mockResolvedValue({ status: 'cancelled', stage });
        mockOpenDeferredModal.mockImplementation(
            () => () =>
                Promise.resolve({
                    value: true,
                    resolve: jest.fn(),
                    selectedFee: null,
                    selectedFeeLevel: 'normal',
                }),
        );
        const store = await dispatchWrap(report);
        expect(
            store.getActions().filter(transactionsActions.transactionBroadcastStatus.match),
        ).toEqual([]);
        expect(report).toHaveBeenCalledWith({
            type: 'transaction/cancel',
            payload: { txType: 'yield', networkSymbol: 'eth', stage },
        });
        expect(report).not.toHaveBeenCalledWith(
            expect.objectContaining({ payload: expect.objectContaining({ type: 'error' }) }),
        );
    });

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
        mockSendEvmTokenTransaction.mockResolvedValue(mockCancelledResult);
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
        const store = buildStore(jest.fn());
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendEvmTokenTransaction.mockResolvedValue(mockSentResult('0xwrap'));

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

        expect(mockSendEvmTokenTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                yieldFlow: { flowKey: 'yield-flow', flowType: 'deposit' },
            }),
        );
    });

    const getTrackedTokenUpdates = (store: WrapNativeTokenTestStore) =>
        store
            .getActions()
            .filter(accountsActions.updateAccount.match)
            .filter(action =>
                action.payload.account.tokens?.some(
                    (accountToken: { contract: string }) =>
                        accountToken.contract.toLowerCase() === token.contractAddress.toLowerCase(),
                ),
            );

    const acceptModalAndSucceed = () => {
        mockOpenDeferredModal.mockImplementation(
            () => () => Promise.resolve({ value: true, resolve: jest.fn() }),
        );
        mockSendEvmTokenTransaction.mockResolvedValue(mockSentResult('0xwrap'));
    };

    it('shows a wrap toast displaying both the native and wrapped assets', async () => {
        acceptModalAndSucceed();
        const store = buildStore(jest.fn());

        await store
            .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1.5' }))
            .unwrap();

        const wrapToast = store
            .getActions()
            .filter(notificationsActions.addToast.match)
            .find(action => action.payload.type === 'tx-wrap');

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
            symbol: ethSymbol,
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
        mockSendEvmTokenTransaction.mockResolvedValue(mockCancelledResult);
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
            mockSendEvmTokenTransaction.mockRejectedValue(error);
        };

        const getFlowErrors = (store: WrapNativeTokenTestStore) =>
            store.getActions().filter(action => action.type === yieldActions.setError.type);

        it('reports a push failure on the deposit step it was started from', async () => {
            acceptModalAndFailWith(
                new Error('push failed', { cause: PUSH_TRANSACTION_FAILED_CAUSE }),
            );
            const store = buildStore(jest.fn());

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
            const store = buildStore(jest.fn());

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
            const store = buildStore(jest.fn());

            await store
                .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
                .unwrap();

            const signErrorToast = store
                .getActions()
                .filter(notificationsActions.addToast.match)
                .find(action => action.payload.type === 'sign-tx-error');

            expect(signErrorToast?.payload).toMatchObject({ error: 'boom' });
        });

        it('does not report a flow error for a standalone wrap', async () => {
            acceptModalAndFailWith(new Error('boom'));
            const store = buildStore(jest.fn());

            await store
                .dispatch(submitWrapNativeTokenThunk({ account, token, wrapAmount: '1' }))
                .unwrap();

            expect(getFlowErrors(store)).toHaveLength(0);
        });

        it('reports a compose failure on the deposit step it was started from', async () => {
            mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
                unwrap: () => Promise.resolve({ type: 'error', reason: 'fee-estimation-failed' }),
            }));
            const store = buildStore(jest.fn());

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

    describe('in-flow failure analytics', () => {
        const yieldFlow = {
            flowKey: 'yield-flow',
            flowType: 'deposit',
            vaultId: 'vault-1',
        } as const;

        const dispatchInFlowWrap = (report: jest.Mock) =>
            buildStore(report)
                .dispatch(
                    submitWrapNativeTokenThunk({ account, token, wrapAmount: '1', yieldFlow }),
                )
                .unwrap();

        const expectDepositError = (report: jest.Mock, errorMessage: string) => {
            expect(report).toHaveBeenCalledWith({
                type: events.yieldDepositEvent.name,
                payload: {
                    type: 'error',
                    action: 'continue',
                    networkSymbol: 'eth',
                    vaultId: 'vault-1',
                    errorMessage,
                },
            });
            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: events.yieldWrapEvent.name }),
            );
        };

        it('reports a compose failure on the deposit event', async () => {
            const report = jest.fn();
            mockComposeYieldWrapTransactionThunk.mockImplementation(() => () => ({
                unwrap: () => Promise.resolve({ type: 'error', reason: 'fee-estimation-failed' }),
            }));

            await dispatchInFlowWrap(report);

            expectDepositError(report, 'wrap-fee-estimation-failed');
        });

        it('reports a device rejection as cancellation without a deposit error', async () => {
            const report = jest.fn();
            mockOpenDeferredModal.mockImplementation(
                () => () =>
                    Promise.resolve({
                        value: true,
                        resolve: jest.fn(),
                        selectedFee: null,
                        selectedFeeLevel: 'normal',
                    }),
            );
            mockSendEvmTokenTransaction.mockResolvedValue(mockCancelledResult);

            await dispatchInFlowWrap(report);

            expect(report).toHaveBeenCalledWith({
                type: 'transaction/cancel',
                payload: { txType: 'yield', networkSymbol: 'eth', stage: 'signing' },
            });
            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ type: 'error' }) }),
            );
        });

        it('reports a thrown signing failure on the deposit event', async () => {
            const report = jest.fn();
            mockOpenDeferredModal.mockImplementation(
                () => () =>
                    Promise.resolve({
                        value: true,
                        resolve: jest.fn(),
                        selectedFee: null,
                        selectedFeeLevel: 'normal',
                    }),
            );
            mockSendEvmTokenTransaction.mockRejectedValue(new Error('boom'));

            await dispatchInFlowWrap(report);

            expectDepositError(report, 'wrap-submit-failed');
        });

        it('reports no deposit error once the wrap is broadcast', async () => {
            const report = jest.fn();
            acceptModalAndSucceed();

            await dispatchInFlowWrap(report);

            expect(report).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: events.yieldDepositEvent.name }),
            );
        });
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

    it('aborts without reporting when the simulation modal is torn down', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(() => () => Promise.resolve(undefined));

        await dispatchWrap(report);

        expect(mockSendEvmTokenTransaction).not.toHaveBeenCalled();
        expect(report).not.toHaveBeenCalled();
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

    it('reports simulation continue and cancellation without an error when signing is cancelled', async () => {
        const report = jest.fn();
        mockOpenDeferredModal.mockImplementation(
            () => () =>
                Promise.resolve({
                    value: true,
                    resolve: jest.fn(),
                    selectedFee: null,
                    selectedFeeLevel: 'normal',
                }),
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
        expect(report).not.toHaveBeenCalledWith(
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
            () => () =>
                Promise.resolve({
                    value: true,
                    resolve: jest.fn(),
                    selectedFee: null,
                    selectedFeeLevel: 'normal',
                }),
        );
        mockSendEvmTokenTransaction.mockResolvedValue(mockSentResult('0xabc'));

        const store = await dispatchWrap(report);
        expect(
            store
                .getActions()
                .filter(transactionsActions.transactionBroadcastStatus.match)
                .map(action => action.payload),
        ).toEqual([{ account, flow: 'wrap', status: 'success', txid: '0xabc' }]);

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
