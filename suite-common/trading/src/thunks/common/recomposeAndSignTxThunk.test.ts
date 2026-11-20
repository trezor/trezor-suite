import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { type DeviceReducerState, prepareDeviceReducer } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    blockchainInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Account, type FeesState } from '@suite-common/wallet-types';
import { type PROTO, type TokenInfo } from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { type RecomposeAndSignTxThunkState } from './recomposeAndSignTxThunk';
import { accountBtc } from '../../__fixtures__/utils';
import { type TradingState, initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { type TradingError, type TradingErrorCode, type TradingFulfillValue } from '../../types';

import { tradingThunks } from './index';

jest.mock('@suite-common/wallet-core', () => {
    const actualModule = jest.requireActual('@suite-common/wallet-core');
    const actualCompose = actualModule.composeSendFormTransactionFeeLevelsThunk;
    // RTK `isRejected(thunk)` detects async thunks via pending/fulfilled/rejected.
    const mockedComposeSendFormTransactionFeeLevelsThunk = Object.assign(jest.fn(), {
        typePrefix: actualCompose.typePrefix,
        pending: actualCompose.pending,
        fulfilled: actualCompose.fulfilled,
        rejected: actualCompose.rejected,
    });

    return {
        ...actualModule,
        composeSendFormTransactionFeeLevelsThunk: mockedComposeSendFormTransactionFeeLevelsThunk,
    };
});

const deviceReducer = prepareDeviceReducer({
    actionTypes: {
        setDeviceMetadata: mockActionType('setDeviceMetadata'),
        setDeviceMetadataPasswords: mockActionType('setDeviceMetadataPasswords'),
        storageLoad: mockActionType('storageLoad'),
    },
    reducers: {
        setDeviceMetadataPasswordsReducer: mockReducer(),
        setDeviceMetadataReducer: mockReducer(),
        storageLoadDevices: mockReducer(),
    },
});
const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const trxSymbol = asNetworkSymbol('trx');
const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const btcFeeData = {
    blockHeight: 890366,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    dustLimit: 546,
    levels: [
        {
            label: 'economy' as const,
            feePerUnit: '1',
            blocks: 7,
        },
        {
            label: 'normal' as const,
            feePerUnit: '2',
            blocks: 2,
        },
        {
            label: 'high' as const,
            feePerUnit: '3',
            blocks: 1,
        },
    ],
};
const fees: FeesState = {
    [accountBtc.symbol]: {
        status: 'loaded',
        data: btcFeeData,
    },
    [trxSymbol]: {
        status: 'loaded',
        data: btcFeeData,
    },
    [solSymbol]: {
        status: 'loaded',
        data: btcFeeData,
    },
};

jest.mock('./createPaymentRequestsThunk', () => ({
    createPaymentRequestsThunk: jest.fn(),
}));

const mockedSuiteReducer = createReducer(
    {
        ...fees,
    },
    () => {},
);

describe('recomposeAndSignTxThunk', () => {
    beforeEach(() => {
        // Mock createPaymentRequestsThunk to return empty array by default
        jest.mocked(tradingThunks.createPaymentRequestsThunk).mockImplementation(
            createThunk(
                tradingThunks.createPaymentRequestsThunk.typePrefix,
                (_, { fulfillWithValue }) => fulfillWithValue([]),
            ),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const mockComposedTransactionInfo = {
        composed: {
            feePerByte: '10',
            estimatedFeeLimit: '1000',
            feeLimit: '1000',
            token: undefined,
            fee: '1000',
            outputs: [],
        },
        selectedFee: 'normal' as const,
    };

    const getMocks = (
        initialTradingState?: Partial<TradingState>,
        deviceFeatures?: Partial<NonNullable<TrezorDevice['features']>>,
    ) => {
        const account = accountBtc as Account;
        const device = mockSuiteDevice();

        const deviceState: Partial<DeviceReducerState> = {
            selectedDevice: {
                features: {
                    major_version: 2,
                    minor_version: 8,
                    patch_version: 11,
                    ...deviceFeatures,
                },
            } as TrezorDevice,
        };

        const { store } = createTestCompositionRoot<void, RecomposeAndSignTxThunkState>({
            reducer: combineReducers({
                wallet: combineReducers({
                    accounts: () => [account],
                    blockchain: () => blockchainInitialState,
                    fees: mockedSuiteReducer,
                    settings: () => initialWalletSettingsState,
                    trading: tradingReducer,
                }),
                device: deviceReducer,
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        composedTransactionInfo: {
                            ...mockComposedTransactionInfo,
                        },
                        ...initialTradingState,
                    },
                },
                device: {
                    devices: [device],
                    selectedDevice: {
                        ...device,
                        ...deviceState.selectedDevice,
                    },
                },
            },
        }).services;
        const tradingFormState = {
            activeSection: 'exchange' as const,
            isSlip24Active: false,
        };

        const mockSignAndPushSendFormTransaction = jest.fn();

        return {
            store,
            account,
            tradingFormState,

            mockSignAndPushSendFormTransaction,
        };
    };

    it('should return error when missing composed data', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                composed: undefined,
            },
        });

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,

                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'missing-composed-data',
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return error when missing feeInfo', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks();

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    symbol: ethSymbol,
                },
                address: 'address',
                amount: '0.1',
                tradingFormState,

                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'missing-composed-data',
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    const missingFeeLevel: TradingError = { type: 'sign-tx-error', code: 'missing-fee-level' };

    it.each<[string, unknown, TradingError]>([
        ['when levels were not found', undefined, missingFeeLevel],
        ['when levels do not contain a normal object', {}, missingFeeLevel],
        [
            'when levels contain normal object with type not final',
            { normal: { type: 'nonfinal', feeLimit: '10' } },
            missingFeeLevel,
        ],
        [
            'when levels contain normal object without feeLimit',
            { normal: { type: 'final' } },
            missingFeeLevel,
        ],
        [
            'when levels contain normal object with error message',
            { normal: { type: 'error', errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' } } },
            {
                ...missingFeeLevel,
                cause: { source: 'precompose', errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' } },
            },
        ],
    ])('should return error for custom fees %s', async (_, levels, expectedPayload) => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: 'custom',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) => fulfillWithValue(levels),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                recalculateCustomLimit: true,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual(expectedPayload);
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return error when selectedFee is undefined', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: undefined,
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        type: 'final',
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'missing-fee-level',
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return error when composedLevels are undefined', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { rejectWithValue }) => rejectWithValue({ error: 'fee-levels-compose-failed' }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'missing-fee-level',
            cause: { source: 'send-form', error: { error: 'fee-levels-compose-failed' } },
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should surface the underlying error when compose is rejected with a message', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { rejectWithValue }) =>
                    rejectWithValue({
                        error: 'fee-levels-compose-failed',
                        message: 'Method_InvalidParameter',
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'compose-failed',
            cause: {
                source: 'send-form',
                error: { error: 'fee-levels-compose-failed', message: 'Method_InvalidParameter' },
            },
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should surface the underlying error when the custom limit recalculation is rejected', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: 'custom',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { rejectWithValue }) =>
                    rejectWithValue({
                        error: 'fee-levels-compose-failed',
                        message: 'Method_InvalidParameter',
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                recalculateCustomLimit: true,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'compose-failed',
            cause: {
                source: 'send-form',
                error: { error: 'fee-levels-compose-failed', message: 'Method_InvalidParameter' },
            },
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return error when selectedFee is not in composedLevels', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: 'economy',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        type: 'final',
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'cannot-create-transaction',
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return error when composedLevels type is not final', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        type: 'nonfinal',
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'cannot-create-transaction',
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return custom error when composedLevels type is not final with passed error data', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'error',
                            errorMessage: {
                                id: 'AMOUNT_IS_NOT_ENOUGH',
                                values: {
                                    error: 'error',
                                },
                            },
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            code: 'cannot-create-transaction',
            cause: {
                source: 'precompose',
                errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH', values: { error: 'error' } },
            },
        });

        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return successful recomposed and signed transaction', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                composed: {
                    ...mockComposedTransactionInfo.composed,
                    feeLimit: undefined,
                    token: {
                        contract: '0x123457',
                    } as TokenInfo,
                },
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: [
                                {
                                    amount: '10000000',
                                },
                            ],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                destinationTag: '123456',
                transactionData: '0x123456',
                ethereumAdjustGasLimit: '1',
                setMaxOutputId: 0,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toEqual({
            success: true,
            payload: {
                txid: 'txid',
            },
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
    });

    it('should keep token in form output for Solana when transactionData is provided', async () => {
        const { store, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                composed: {
                    ...mockComposedTransactionInfo.composed,
                    token: {
                        contract: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                    } as TokenInfo,
                },
            },
        });

        const solanaAccount = {
            ...accountBtc,
            symbol: solSymbol,
            networkType: 'solana',
            descriptor: 'solanaAccountDescriptor',
        } as Account;

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: [
                                {
                                    amount: '10000000',
                                },
                            ],
                        },
                    }),
            ),
        );

        await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: solanaAccount,
                address: 'recipient',
                amount: '1.25',
                transactionData: 'abcd',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(
            (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mock.calls[0][0]
                .formState.outputs[0].token,
        ).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    });

    it.each([
        {
            signingResult: undefined,
            expectedType: 'sign-cancelled',
            expectedCode: 'cannot-send-transaction',
        },
        {
            signingResult: { success: false, error: { error: 'push-approval-rejected' } },
            expectedType: 'sign-cancelled',
            expectedCode: 'cannot-send-transaction',
        },
        {
            signingResult: {
                success: false,
                error: { error: 'sign-transaction-timeout', message: 'Signing process timed out.' },
            },
            expectedType: 'sign-transaction-timeout',
            expectedCode: 'sign-transaction-failed',
        },
        ...(['Failure_ActionCancelled', 'Failure_PinCancelled', 'Method_Cancel'] as const).map(
            errorCode => ({
                signingResult: {
                    success: false as const,
                    error: {
                        error: 'sign-transaction-failed' as const,
                        errorCode,
                        message: 'Cancelled',
                    },
                },
                expectedType: 'sign-cancelled' as const,
                expectedCode: 'sign-transaction-failed' as const,
            }),
        ),
        ...(['Device_Disconnected', 'Device_NotFound'] as const).map(errorCode => ({
            signingResult: {
                success: false as const,
                error: {
                    error: 'sign-transaction-failed' as const,
                    errorCode,
                    message: 'Device disconnected',
                },
            },
            expectedType: 'sign-tx-error' as const,
            expectedCode: 'device-not-connected' as const,
        })),
        {
            signingResult: {
                success: false,
                error: {
                    error: 'sign-transaction-failed',
                    errorCode: 'Failure_DataError',
                    message: 'Invalid data',
                },
            },
            expectedType: 'sign-tx-error',
            expectedCode: 'sign-transaction-failed',
        },
        {
            signingResult: {
                success: false,
                error: { error: 'sign-transaction-failed', message: 'Unknown error' },
            },
            expectedType: 'sign-tx-error',
            expectedCode: 'sign-transaction-failed',
        },
        {
            signingResult: {
                success: false,
                error: {
                    error: 'push-transaction-failed',
                    errorCode: 'Backend_Error',
                    message: 'Blockhash not found',
                },
            },
            expectedType: 'sign-tx-error',
            expectedCode: 'push-transaction-failed',
        },
        {
            signingResult: {
                success: false,
                error: { error: 'push-transaction-pending-conflict', message: 'Pending conflict' },
            },
            expectedType: 'sign-tx-error',
            expectedCode: 'push-transaction-failed',
        },
        {
            signingResult: {
                success: false,
                error: { error: 'fee-levels-compose-failed', message: 'Insufficient funds' },
            },
            expectedType: 'sign-tx-error',
            expectedCode: 'compose-failed',
        },
        {
            signingResult: {
                success: false,
                error: { error: 'enhance-transaction-failed', message: 'Fee too low' },
            },
            expectedType: 'sign-tx-error',
            expectedCode: 'compose-failed',
        },
    ] satisfies {
        signingResult: TradingFulfillValue;
        expectedType: TradingError['type'];
        expectedCode: TradingErrorCode;
    }[])(
        'should reject as $expectedType with $expectedCode when signing returns $signingResult',
        async ({ signingResult, expectedType, expectedCode }) => {
            const { store, account, tradingFormState } = getMocks();

            const mockSignAndPushSendFormTransaction = jest
                .fn()
                .mockResolvedValueOnce(signingResult);

            (
                composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock
            ).mockImplementationOnce(
                createThunk(
                    composeSendFormTransactionFeeLevelsThunk.typePrefix,
                    (_, { fulfillWithValue }) =>
                        fulfillWithValue({
                            normal: {
                                type: 'final',
                                outputs: [
                                    {
                                        amount: '10000000',
                                    },
                                ],
                            },
                        }),
                ),
            );

            const response = await store.dispatch(
                tradingThunks.recomposeAndSignTxThunk({
                    account,
                    address: 'address',
                    amount: '0.1',
                    tradingFormState,
                    signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
                }),
            );

            expect(response.meta.requestStatus).toBe('rejected');
            expect(response.payload).toEqual({
                type: expectedType,
                code: expectedCode,
                cause:
                    signingResult?.success === false
                        ? { source: 'send-form', error: signingResult.error }
                        : undefined,
            });
            expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
        },
    );

    it('should return successful recomposed and signed transaction using custom fees', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: 'custom',
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementation(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            feeLimit: '1111',
                            outputs: [
                                {
                                    amount: '10000000',
                                },
                            ],
                        },
                        custom: {
                            type: 'final',
                            outputs: [
                                {
                                    amount: '10000000',
                                },
                            ],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                recalculateCustomLimit: true,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toEqual({
            success: true,
            payload: {
                txid: 'txid',
            },
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
    });

    it('should keep the user custom feeLimit when it is higher than the recalculated normal feeLimit', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                composed: {
                    ...mockComposedTransactionInfo.composed,
                    feeLimit: '5000',
                },
                selectedFee: 'custom',
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementation(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            feeLimit: '1111',
                            outputs: [{ amount: '10000000' }],
                        },
                        custom: {
                            type: 'final',
                            outputs: [{ amount: '10000000' }],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                recalculateCustomLimit: true,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(mockSignAndPushSendFormTransaction.mock.calls[0][0].formState.feeLimit).toBe('5000');
    });

    it('should raise the user custom feeLimit to the recalculated normal feeLimit when it is lower', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                composed: {
                    ...mockComposedTransactionInfo.composed,
                    feeLimit: '500',
                },
                selectedFee: 'custom',
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementation(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            feeLimit: '1111',
                            outputs: [{ amount: '10000000' }],
                        },
                        custom: {
                            type: 'final',
                            outputs: [{ amount: '10000000' }],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                recalculateCustomLimit: true,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(mockSignAndPushSendFormTransaction.mock.calls[0][0].formState.feeLimit).toBe('1111');
    });

    it('should derive the Tron fee limit from the recomposed tx (real recipient), not the offers estimate', async () => {
        const { store, tradingFormState } = getMocks({
            composedTransactionInfo: {
                selectedFee: 'normal',
                composed: {
                    feePerByte: '100',
                    // offers-page estimate against a placeholder (warm) recipient
                    estimatedFeeLimit: '6428500', // SUN
                    feeLimit: '64285', // energy units
                    token: { contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' } as TokenInfo,
                    fee: '6428500',
                },
            },
        });

        const account = { ...accountBtc, symbol: 'trx', networkType: 'tron' } as Account;

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: { txid: 'txid' },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            // recompose against the real (cold) recipient — higher energy
                            feeLimit: '120000',
                            estimatedFeeLimit: '12000000',
                            fee: '12000000',
                            outputs: [{ amount: '10000000' }],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
        expect(mockSignAndPushSendFormTransaction.mock.calls[0][0].formState.feeLimit).toBe(
            '12000000',
        );
    });

    it('should sign the recomposed native TRX fee, correcting an activation fee the real recipient does not need', async () => {
        const { store, tradingFormState } = getMocks({
            composedTransactionInfo: {
                selectedFee: 'normal',
                composed: {
                    feePerByte: '1000',
                    // Offers-page estimate against the cold stand-in recipient:
                    // 0.1 create-account fee + 1 activation.
                    fee: '1100000',
                },
            },
        });

        const account = { ...accountBtc, symbol: trxSymbol, networkType: 'tron' } as Account;

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: { txid: 'txid' },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            // Recompose against the real payin address, which turned out to be
                            // activated already — bandwidth burn only.
                            fee: '100000',
                            outputs: [{ amount: '10000000' }],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
        expect(mockSignAndPushSendFormTransaction.mock.calls[0][0].precomposedTransaction.fee).toBe(
            '100000',
        );
    });

    it('should keep the composed feeLimit for non-Tron networks', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                selectedFee: 'normal',
                composed: {
                    feePerByte: '10',
                    estimatedFeeLimit: '6428500',
                    feeLimit: '64285',
                    token: { contract: '0x123457' } as TokenInfo,
                    fee: '1000',
                },
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: { txid: 'txid' },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: [{ amount: '10000000' }],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
        expect(mockSignAndPushSendFormTransaction.mock.calls[0][0].formState.feeLimit).toBe(
            '64285',
        );
    });

    it('should create payment requests when SLIP24 is active and conditions are met', async () => {
        const { store, account, tradingFormState } = getMocks(
            {
                composedTransactionInfo: {
                    ...mockComposedTransactionInfo,
                },
            },
            {
                minor_version: 12,
                patch_version: 5,
            },
        );

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid-with-payment-requests',
            },
        });

        const mockPaymentRequests = [
            {
                recipient_name: 'Test Exchange',
                amount: '100000',
                nonce: 'test-nonce',
                signature: 'test-signature',
                memos: [],
            },
        ];

        // Mock createPaymentRequestsThunk to return payment requests
        jest.mocked(tradingThunks.createPaymentRequestsThunk).mockImplementationOnce(
            createThunk(
                tradingThunks.createPaymentRequestsThunk.typePrefix,
                (_, { fulfillWithValue }) => fulfillWithValue(mockPaymentRequests),
            ),
        );

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: [
                                {
                                    address: 'address',
                                    amount: '10000000',
                                },
                            ],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    networkType: 'bitcoin' as const,
                } as Account,
                address: 'address',
                amount: '0.1',
                isSlip24Active: true,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(response.payload).toEqual({
            success: true,
            payload: {
                txid: 'txid-with-payment-requests',
            },
        });
        expect(tradingThunks.createPaymentRequestsThunk).toHaveBeenCalledWith({
            account,
            composedLevels: {
                outputs: [
                    {
                        address: 'address',
                        amount: '10000000',
                    },
                ],
                type: 'final',
            },
            destinationTag: undefined,
            formattedMaxAmount: '0.1',
            type: 'exchange',
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledWith({
            formState: expect.any(Object),
            precomposedTransaction: expect.any(Object),
            selectedAccount: expect.any(Object),
            paymentRequests: mockPaymentRequests,
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
    });

    describe('when signing with payment requests fails', () => {
        const dispatchWithPaymentRequests = (
            signAndPushSendFormTransaction: jest.Mock<Promise<TradingFulfillValue>>,
        ) => {
            const { store, account, tradingFormState } = getMocks(
                { composedTransactionInfo: { ...mockComposedTransactionInfo } },
                { minor_version: 12, patch_version: 5 },
            );

            (
                composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock
            ).mockImplementationOnce(
                createThunk(
                    composeSendFormTransactionFeeLevelsThunk.typePrefix,
                    (_, { fulfillWithValue }) =>
                        fulfillWithValue({
                            normal: {
                                type: 'final',
                                outputs: [{ address: 'address', amount: '10000000' }],
                            },
                        }),
                ),
            );

            return store.dispatch(
                tradingThunks.recomposeAndSignTxThunk({
                    account,
                    address: 'address',
                    amount: '0.1',
                    isSlip24Active: true,
                    tradingFormState,
                    signAndPushSendFormTransaction,
                }),
            );
        };

        it('keeps the trading error of rejected payment requests', async () => {
            const paymentRequestsError: TradingError = {
                type: 'sign-tx-error',
                code: 'nonce-failed',
                cause: { source: 'connect', code: 'Device_Disconnected', message: 'Disconnected' },
            };
            jest.mocked(tradingThunks.createPaymentRequestsThunk).mockImplementationOnce(
                createThunk<
                    PROTO.PaymentRequest[],
                    Parameters<typeof tradingThunks.createPaymentRequestsThunk>[0],
                    { rejectValue: TradingError }
                >(tradingThunks.createPaymentRequestsThunk.typePrefix, (_, { rejectWithValue }) =>
                    rejectWithValue(paymentRequestsError),
                ),
            );
            const signAndPushSendFormTransaction = jest.fn<Promise<TradingFulfillValue>, []>();

            const response = await dispatchWithPaymentRequests(signAndPushSendFormTransaction);

            expect(response.meta.requestStatus).toBe('rejected');
            expect(response.payload).toEqual(paymentRequestsError);
            expect(signAndPushSendFormTransaction).not.toHaveBeenCalled();
        });

        it('keeps the message of a throwing sign and push as an unexpected cause', async () => {
            const signAndPushSendFormTransaction = jest
                .fn<Promise<TradingFulfillValue>, []>()
                .mockRejectedValueOnce(new Error('Sign and push crashed'));

            const response = await dispatchWithPaymentRequests(signAndPushSendFormTransaction);

            expect(response.meta.requestStatus).toBe('rejected');
            expect(response.payload).toEqual({
                type: 'sign-tx-error',
                code: 'cannot-send-transaction',
                cause: { source: 'unexpected', message: 'Sign and push crashed' },
            });
        });
    });

    it('should use the payment output amount as formattedMaxAmount when send-max has extra outputs', async () => {
        const { store, account, tradingFormState } = getMocks(
            {
                composedTransactionInfo: {
                    ...mockComposedTransactionInfo,
                },
            },
            {
                minor_version: 12,
                patch_version: 5,
            },
        );

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid-with-payment-requests',
            },
        });

        jest.mocked(tradingThunks.createPaymentRequestsThunk).mockImplementationOnce(
            createThunk(
                tradingThunks.createPaymentRequestsThunk.typePrefix,
                (_, { fulfillWithValue }) => fulfillWithValue([]),
            ),
        );

        const paymentAddress = 'address';
        const composedOutputs = [
            {
                amount: '0',
                script_type: 'PAYTOOPRETURN' as const,
                op_return_data: 'deadbeef',
            },
            {
                amount: '20000000',
                address: paymentAddress,
            },
            {
                amount: '1000',
                address_n: [44, 0, 0, 1, 0],
            },
        ];

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: composedOutputs,
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    networkType: 'bitcoin' as const,
                } as Account,
                address: paymentAddress,
                amount: '0.1',
                setMaxOutputId: 0,
                isSlip24Active: true,
                tradingFormState: {
                    ...tradingFormState,
                    send: {
                        amount: '0.1',
                        symbol: account.symbol,
                        cryptoId: undefined,
                        accountKey: undefined,
                    },
                },
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(tradingThunks.createPaymentRequestsThunk).toHaveBeenCalledWith({
            account,
            composedLevels: {
                outputs: composedOutputs,
                type: 'final',
            },
            destinationTag: undefined,
            formattedMaxAmount: '0.2',
            type: 'exchange',
        });
    });

    it('should not create payment requests for sell when firmware does not support SLIP24 sells', async () => {
        const { store, account, tradingFormState } = getMocks(
            {
                composedTransactionInfo: {
                    ...mockComposedTransactionInfo,
                },
            },
            {
                minor_version: 12,
                patch_version: 5,
            },
        );

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid-without-payment-requests',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: [
                                {
                                    amount: '10000000',
                                },
                            ],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    networkType: 'bitcoin' as const,
                } as Account,
                address: 'address',
                amount: '0.1',
                isSlip24Active: true,
                tradingFormState: { ...tradingFormState, activeSection: 'sell' as const },
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(tradingThunks.createPaymentRequestsThunk).not.toHaveBeenCalled();
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledWith({
            formState: expect.any(Object),
            precomposedTransaction: expect.any(Object),
            selectedAccount: expect.any(Object),
            paymentRequests: [],
        });
    });

    it('should not create payment requests when SLIP24 is not active', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn().mockResolvedValueOnce({
            success: true,
            payload: {
                txid: 'txid-without-payment-requests',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            outputs: [
                                {
                                    amount: '10000000',
                                },
                            ],
                        },
                    }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    networkType: 'bitcoin',
                } as Account,
                address: 'address',
                amount: '0.1',
                isSlip24Active: false,
                tradingFormState,
                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(tradingThunks.createPaymentRequestsThunk).not.toHaveBeenCalled();
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledWith({
            formState: expect.any(Object),
            precomposedTransaction: expect.any(Object),
            selectedAccount: expect.any(Object),
            paymentRequests: [],
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(1);
    });
});
