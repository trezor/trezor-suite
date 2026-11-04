import { createAction } from '@reduxjs/toolkit';
import type { CryptoId, ExchangeTrade } from 'invity-api';

import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { type TokenAddress, type TokenInfoBranded } from '@suite-common/tokens';
import {
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { type SendFormError } from '@suite-common/wallet-core';
import {
    type Account,
    type FormState,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { selectAccountTokenInfo } from '@suite-native/tokens';
import { eth1NormalAccount, invityDexQuote } from '@suite-native/trading-fixtures';
import { asGetter, createMockDeps, mock } from '@trezor/dependency-injection';
import { type ReduxStoreWithThunk } from '@trezor/redux-utils';
import { createMockDispatch } from '@trezor/redux-utils/mocks';
import { type Ok, ok } from '@trezor/type-utils';

import { createTradingTestStore } from './test-utils/tradingTestUtils';
import {
    type ComposeEvmApprovalFeeLevelsThunkState,
    type ComposeTradingTransactionThunkState,
    type SignAndPushSendFormTransactionThunkDeps,
    type SignAndPushSendFormTransactionThunkState,
    clearTradingStateThunk,
    composeEvmApprovalFeeLevelsThunk,
    composeTradingTransactionThunk,
    signAndPushSendFormTransactionThunk,
} from './thunks';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    default: {
        blockchainEstimateFee: jest.fn().mockResolvedValue({
            success: true,
            payload: {
                levels: [{ feeLimit: '52000' }],
            },
        }),
        composeTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: [
                {
                    type: 'final',
                    totalSpent: '100000',
                    fee: '21000',
                    feePerByte: '1',
                    feeLimit: '21000',
                    estimatedFeeLimit: '21000',
                    bytes: 250,
                },
            ],
        }),
        ethereumSignTransaction: jest.fn().mockResolvedValue({
            success: true,
            payload: {
                serializedTx: '0x1234567890abcdef',
            },
        }),
        getAccountInfo: jest.fn().mockResolvedValue({
            success: true,
            payload: {
                availableBalance: '1000000',
            },
        }),
    },
}));

const mockPrecomposedLevels = {
    normal: {
        type: 'final' as const,
        fee: '21000',
        feePerByte: '20',
        feeLimit: '52000',
        estimatedFeeLimit: '52000',
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        token: undefined,
        totalSpent: '0',
        bytes: 0,
        inputs: [],
        outputsPermutation: [0],
        outputs: [],
    },
};

const mockTokenInfo = {
    standard: 'ERC20' as const,
    name: 'USDC',
    contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
    symbol: 'usdc',
    decimals: 6,
    balance: '100000000',
} as TokenInfoBranded;

const mockComposeSendFormTransactionFeeLevelsThunk = jest.fn();
type MockThunkAction<TPayload> = {
    type: string;
    payload?: TPayload;
    error?: { message: string };
    meta: {
        requestId: string;
        requestStatus: 'fulfilled' | 'rejected';
        rejectedWithValue?: boolean;
    };
};

const mockEnhanceTransactionResult =
    mock<() => MockThunkAction<GeneralPrecomposedTransactionFinal | SendFormError>>();
const mockSignTransactionResult =
    mock<() => MockThunkAction<{ serializedTx: string } | SendFormError>>();
const mockPushTransactionResult =
    mock<() => MockThunkAction<Ok<{ txid: string }> | SendFormError>>();

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actual,
        selectIsMevProtectionEnabled: () => false,
        enhancePrecomposedTransactionThunk: () => () =>
            Promise.resolve(mockEnhanceTransactionResult()),
        signTransactionThunk: () => () => Promise.resolve(mockSignTransactionResult()),
        pushSendFormTransactionThunk: () => () => Promise.resolve(mockPushTransactionResult()),
        composeAllowanceTransactionThunk: () => () =>
            Promise.resolve({
                type: '@common/wallet-core/approval/composeAllowanceTransactionThunk/fulfilled',
                payload: mockPrecomposedLevels,
                meta: {
                    requestId: 'test-request-id',
                    requestStatus: 'fulfilled' as const,
                },
            }),
        composeSendFormTransactionFeeLevelsThunk: (params: unknown) => () => {
            mockComposeSendFormTransactionFeeLevelsThunk(params);

            return Promise.resolve({
                type: '@common/wallet-core/send/composeSendFormTransactionFeeLevelsThunk/fulfilled',
                payload: {},
                meta: {
                    requestId: 'test-request-id',
                    requestStatus: 'fulfilled' as const,
                },
            });
        },
    };
});

jest.mock('@suite-native/tokens', () => ({
    ...jest.requireActual('@suite-native/tokens'),
    selectAccountTokenInfo: jest.fn(() => mockTokenInfo),
}));

describe('thunks', () => {
    const feeInfo = {
        blockHeight: 0,
        blockTime: 15,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 0,
        dustLimit: -1,
        levels: [{ label: 'normal' as const, feePerUnit: '20', blocks: 1 }],
    };

    const dispatch = jest.fn();
    const getState = jest.fn();
    const extra = {};

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(selectAccountTokenInfo).mockReturnValue(mockTokenInfo);
    });

    describe('clearTradingStateThunk', () => {
        it('should clear last error message for all trade types', async () => {
            const thunk = clearTradingStateThunk();
            await thunk(dispatch, getState, extra);

            expect(dispatch).toHaveBeenCalledWith(
                tradingSellActions.setLastErrorMessage(undefined),
            );
            expect(dispatch).toHaveBeenCalledWith(
                tradingExchangeActions.setLastErrorMessage(undefined),
            );
            expect(dispatch).toHaveBeenCalledWith(tradingBuyActions.setLastErrorMessage(undefined));
        });
    });

    describe('composeEvmApprovalFeeLevelsThunk', () => {
        let store: ReduxStoreWithThunk<ComposeEvmApprovalFeeLevelsThunkState, Record<never, never>>;

        const dexQuoteWithApprovalData: ExchangeTrade = {
            ...invityDexQuote,
            isDex: true,
            sendStringAmount: '100',
            send: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
            dexTx: {
                from: '0x0000000000000000000000000000000000000000',
                to: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
                data: '0x095ea7b3000000000000000000000000def171fe48cf0115b1d80b88dc8eab59176fee570000000000000000000000000000000000000000000000000000000005f5e100',
                value: '0x0',
            },
        };

        beforeEach(() => {
            store = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: { tradingAccountKey: eth1NormalAccount.key },
                        },
                    },
                    device: {
                        selectedDevice: {
                            state: { staticSessionId: 'device1@test:123' },
                            features: { major_version: 2, minor_version: 6, patch_version: 0 },
                        },
                    },
                },
            });
        });

        it('should reject when dexTx data is missing', async () => {
            const quoteWithoutDexTx = {
                ...dexQuoteWithApprovalData,
                dexTx: undefined,
            } as ExchangeTrade;

            const ethAccount = store
                .getState()
                .wallet.accounts.find((account: Account) => account.key === eth1NormalAccount.key);

            const result = await store.dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote: quoteWithoutDexTx,
                    account: ethAccount!,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('rejected');
            expect(result.payload).toBe('DEX quote with dexTx data is required');
        });

        it('should compose allowance fee levels for a DEX quote', async () => {
            const ethAccount = store
                .getState()
                .wallet.accounts.find((account: Account) => account.key === eth1NormalAccount.key);

            const result = await store.dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote: dexQuoteWithApprovalData,
                    account: ethAccount!,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('fulfilled');
        });

        it('should merge composed approval fees into existing exchange form draft without dropping fields', async () => {
            const formDraftKey = getFormDraftKey('trading-exchange', '');

            const localStore = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: { tradingAccountKey: eth1NormalAccount.key },
                        },
                        formDrafts: {
                            [formDraftKey]: {
                                swapOnlyField: 'keep-around',
                                outputs: [
                                    {
                                        type: 'payment' as const,
                                        address: '0xabc',
                                        amount: '1',
                                        fiat: '',
                                        currency: { label: '', value: '' },
                                        label: '',
                                        token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
                                    },
                                ],
                            },
                        },
                    },
                    device: {
                        selectedDevice: {
                            state: { staticSessionId: 'device1@test:123' },
                            features: { major_version: 2, minor_version: 6, patch_version: 0 },
                        },
                    },
                },
            });
            const ethAccount = localStore
                .getState()
                .wallet.accounts.find((account: Account) => account.key === eth1NormalAccount.key);

            const result = await localStore.dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote: dexQuoteWithApprovalData,
                    account: ethAccount!,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('fulfilled');

            const draft = localStore.getState().wallet.formDrafts[formDraftKey];
            expect(draft?.swapOnlyField).toBe('keep-around');
            expect(draft?.selectedFee).toBe('normal');
            expect(draft?.feePerUnit).toBe('20');
            expect(draft?.feeLimit).toBe('52000');
            expect(draft?.outputs[0]?.address).toBe('0xabc');
        });

        it('should add default payment output with token when exchange form draft has no outputs', async () => {
            const formDraftKey = getFormDraftKey('trading-exchange', '');

            const localStore = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: { tradingAccountKey: eth1NormalAccount.key },
                        },
                        formDrafts: {},
                    },
                    device: {
                        selectedDevice: {
                            state: { staticSessionId: 'device1@test:123' },
                            features: { major_version: 2, minor_version: 6, patch_version: 0 },
                        },
                    },
                },
            });
            const ethAccount = localStore
                .getState()
                .wallet.accounts.find((account: Account) => account.key === eth1NormalAccount.key);

            const result = await localStore.dispatch(
                composeEvmApprovalFeeLevelsThunk({
                    quote: dexQuoteWithApprovalData,
                    account: ethAccount!,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('fulfilled');

            const draft = localStore.getState().wallet.formDrafts[formDraftKey];
            expect(draft?.outputs[0]?.token).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
        });
    });

    describe('composeTradingTransactionThunk', () => {
        it('should compose trading transaction without assuming the receiving account is new', async () => {
            const store = createTradingTestStore({
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: {
                                tradingAccountKey: eth1NormalAccount.key,
                                selectedQuote: invityDexQuote,
                            },
                        },
                    },
                },
            });
            const ethAccount = store
                .getState()
                .wallet.accounts.find((account: Account) => account.key === eth1NormalAccount.key);
            const network = getNetwork(ethAccount!.symbol);

            // Blockchain state is only read by the mocked compose thunk.
            const thunkStore = store as unknown as ReduxStoreWithThunk<
                ComposeTradingTransactionThunkState,
                Record<never, never>
            >;

            const result = await thunkStore.dispatch(
                composeTradingTransactionThunk({
                    tradeType: 'exchange',
                    account: ethAccount!,
                    network,
                    feeInfo,
                }),
            );

            expect(result.type).toContain('fulfilled');
            expect(mockComposeSendFormTransactionFeeLevelsThunk).toHaveBeenCalledWith(
                expect.objectContaining({
                    composeContext: {
                        account: ethAccount,
                        network,
                        feeInfo,
                    },
                }),
            );
        });
    });
});

describe('signAndPushSendFormTransactionThunk', () => {
    const fulfilledAction = <TPayload>(payload: TPayload): MockThunkAction<TPayload> => ({
        type: 'test/fulfilled',
        payload,
        meta: { requestId: 'test', requestStatus: 'fulfilled' },
    });
    const rejectedAction = (
        payload?: SendFormError,
        message = 'Rejected',
    ): MockThunkAction<SendFormError> => ({
        type: 'test/rejected',
        payload,
        error: { message },
        meta: {
            requestId: 'test',
            requestStatus: 'rejected',
            rejectedWithValue: payload !== undefined,
        },
    });

    const formState: FormState = {
        outputs: [],
        feePerUnit: '',
        feeLimit: '',
        options: [],
        isCoinControlEnabled: false,
        hasCoinControlBeenOpened: false,
        selectedUtxos: [],
    };

    const signAndPush = (waitForPushApprovalPromise = () => Promise.resolve(true)) => {
        const getState = mock<() => SignAndPushSendFormTransactionThunkState>();
        const extra: SignAndPushSendFormTransactionThunkDeps = {
            actions: { onModalCancel: createAction<void>('test/onModalCancel') },
            services: {
                analytics: mockNativeAnalytics(),
                networks: createMockDeps<
                    SignAndPushSendFormTransactionThunkDeps['services']['networks']
                >({ getAccountSyncInterval: null }),
                getIsWindowVisible: asGetter(() => true),
                getTradedAccountKeys: asGetter(() => []),
                suiteSync: mockSuiteSync(),
            },
        };
        const { dispatch } = createMockDispatch({ getState, extra });

        return signAndPushSendFormTransactionThunk({
            formState,
            precomposedTransaction: mockPrecomposedLevels.normal,
            selectedAccount: eth1NormalAccount,
            waitForPushApprovalPromise,
        })(dispatch, getState, extra);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockEnhanceTransactionResult.mockReturnValue(fulfilledAction(mockPrecomposedLevels.normal));
        mockSignTransactionResult.mockReturnValue(fulfilledAction({ serializedTx: 'signed' }));
        mockPushTransactionResult.mockReturnValue(fulfilledAction(ok({ txid: 'txid' })));
    });

    it.each<[string, () => void, SendFormError]>([
        [
            'enhance',
            () =>
                mockEnhanceTransactionResult.mockReturnValue(
                    rejectedAction({
                        error: 'enhance-transaction-failed',
                        message: 'Device not found',
                    }),
                ),
            { error: 'enhance-transaction-failed', message: 'Device not found' },
        ],
        [
            'sign',
            () =>
                mockSignTransactionResult.mockReturnValue(
                    rejectedAction({
                        error: 'sign-transaction-failed',
                        errorCode: 'Device_Disconnected',
                        message: 'Device disconnected',
                    }),
                ),
            {
                error: 'sign-transaction-failed',
                errorCode: 'Device_Disconnected',
                message: 'Device disconnected',
            },
        ],
        [
            'push',
            () =>
                mockPushTransactionResult.mockReturnValue(
                    rejectedAction({
                        error: 'push-transaction-failed',
                        metadata: {
                            success: false,
                            error: { code: 'Backend_Error', message: 'Blockhash not found' },
                        },
                    }),
                ),
            {
                error: 'push-transaction-failed',
                metadata: {
                    success: false,
                    error: { code: 'Backend_Error', message: 'Blockhash not found' },
                },
            },
        ],
    ])('rejects with the original %s error', async (_, arrangeFailure, expectedError) => {
        arrangeFailure();

        const result = await signAndPush();

        expect(result.payload).toEqual(expectedError);
    });

    it('keeps the thrown message when signing rejects without a typed error', async () => {
        mockSignTransactionResult.mockReturnValue(rejectedAction(undefined, 'Unexpected failure'));

        const result = await signAndPush();

        expect(result.payload).toEqual({
            error: 'sign-transaction-failed',
            message: 'Unexpected failure',
        });
    });

    it('rejects as push approval rejected when the user does not approve sending', async () => {
        const result = await signAndPush(() => Promise.resolve(false));

        expect(result.payload).toEqual({ error: 'push-approval-rejected' });
        expect(mockPushTransactionResult).not.toHaveBeenCalled();
    });

    it('fulfills with the txid when the transaction is pushed', async () => {
        const result = await signAndPush();

        expect(result.payload).toEqual({ success: true, payload: { txid: 'txid' } });
    });
});
