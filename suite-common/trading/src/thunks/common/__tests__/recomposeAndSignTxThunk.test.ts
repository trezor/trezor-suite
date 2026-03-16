import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { type DeviceReducerState, prepareDeviceReducer } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { composeSendFormTransactionFeeLevelsThunk } from '@suite-common/wallet-core';
import { type Account, type FeesState } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { accountBtc } from '../../../__fixtures__/utils';
import { type TradingState, initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { tradingThunks } from '../index';

jest.mock('@suite-common/wallet-core', () => {
    const actualModule = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actualModule,
        composeSendFormTransactionFeeLevelsThunk: jest.fn(),
    };
});

const deviceReducer = prepareDeviceReducer(extraDependenciesCommonMock);
const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);
const fees: FeesState = {
    [accountBtc.symbol]: {
        data: {
            blockHeight: 890366,
            blockTime: 10,
            minFee: 1,
            maxFee: 100,
            dustLimit: 546,
            levels: [
                {
                    label: 'economy',
                    feePerUnit: '1',
                    blocks: 7,
                },
                {
                    label: 'normal',
                    feePerUnit: '2',
                    blocks: 2,
                },
                {
                    label: 'high',
                    feePerUnit: '3',
                    blocks: 1,
                },
            ],
        },
    },
};

jest.mock('../createPaymentRequestsThunk', () => ({
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

    const getMocks = (initialTradingState?: Partial<TradingState>) => {
        const account = accountBtc as Account;
        const device = mockSuiteDevice();

        const deviceState: Partial<DeviceReducerState> = {
            selectedDevice: {
                features: {
                    major_version: 2,
                    minor_version: 8,
                    patch_version: 11,
                },
            } as TrezorDevice,
        };

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    fees: mockedSuiteReducer,
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
        });
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
            error: {
                id: 'TR_TRADING_MISSING_COMPOSED_DATA',
            },
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it('should return error when missing feeInfo', async () => {
        const { store, account, tradingFormState, mockSignAndPushSendFormTransaction } = getMocks();

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    symbol: undefined as unknown,
                } as Account,
                address: 'address',
                amount: '0.1',
                tradingFormState,

                signAndPushSendFormTransaction: mockSignAndPushSendFormTransaction,
            }),
        );

        expect(response.meta.requestStatus).toBe('rejected');
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            error: {
                id: 'TR_TRADING_MISSING_COMPOSED_DATA',
            },
        });
        expect(mockSignAndPushSendFormTransaction).toHaveBeenCalledTimes(0);
    });

    it.each([
        ['when levels were not found', undefined, 'TR_TRADING_MISSING_FEE_LEVEL'],
        ['when levels do not contain a normal object', {}, 'TR_TRADING_MISSING_FEE_LEVEL'],
        [
            'when levels contain normal object with type not final',
            { normal: { type: 'nonfinal', feeLimit: '10' } },
            'TR_TRADING_MISSING_FEE_LEVEL',
        ],
        [
            'when levels contain normal object without feeLimit',
            { normal: { type: 'final' } },
            'TR_TRADING_MISSING_FEE_LEVEL',
        ],
        [
            'when levels contain normal object with error message',
            { normal: { type: 'error', errorMessage: { id: 'TR_ERROR' } } },
            'TR_ERROR',
        ],
    ])('should return error for custom fees %s', async (_, levels, errorId) => {
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
        expect(response.payload).toEqual({
            type: 'sign-tx-error',
            error: {
                id: errorId,
            },
        });
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
            error: {
                id: 'TR_TRADING_MISSING_FEE_LEVEL',
            },
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
            error: {
                id: 'TR_TRADING_MISSING_FEE_LEVEL',
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
            error: {
                id: 'TR_TRADING_CANNOT_CREATE_TRANSACTION',
            },
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
            error: {
                id: 'TR_TRADING_CANNOT_CREATE_TRANSACTION',
            },
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
                                id: 'TR_ERROR',
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
            error: {
                id: 'TR_ERROR',
                values: {
                    error: 'error',
                },
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

    it('should create payment requests when SLIP24 is active and conditions are met', async () => {
        const { store, account, tradingFormState } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
            },
        });

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
                        amount: '10000000',
                    },
                ],
                type: 'final',
            },
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
