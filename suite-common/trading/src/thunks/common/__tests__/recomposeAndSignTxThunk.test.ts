import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { composeSendFormTransactionFeeLevelsThunk } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { TokenInfo } from '@trezor/connect';

import { tradingThunks } from '../../';
import { accountBtc } from '../../../__fixtures__/utils';
import {
    TradingState,
    initialState,
    prepareTradingReducer,
} from '../../../reducers/tradingReducer';

jest.mock('@suite-common/wallet-core', () => {
    const actualModule = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actualModule,
        composeSendFormTransactionFeeLevelsThunk: jest.fn(),
    };
});

const tradingReducer = prepareTradingReducer(extraDependenciesMock);
const fees = {
    [accountBtc.symbol]: {
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
};

const mockedSuiteReducer = createReducer(
    {
        ...fees,
    },
    () => {},
);

describe('recomposeAndSignTxThunk', () => {
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
        },
        selectedFee: 'normal' as const,
    };

    const getMocks = (initialTradingState?: Partial<TradingState>) => {
        const account = accountBtc as Account;

        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    tradingNew: tradingReducer,
                    fees: mockedSuiteReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
                        ...initialState,
                        composedTransactionInfo: {
                            ...mockComposedTransactionInfo,
                        },
                        ...initialTradingState,
                    },
                },
            },
        });

        const mockSignAndPushSendFormTransaction = jest.fn();

        return {
            store,
            account,

            mockSignAndPushSendFormTransaction,
        };
    };

    it('should return error when missing composed data', async () => {
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks({
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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks();

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account: {
                    ...account,
                    symbol: undefined as unknown,
                } as Account,
                address: 'address',
                amount: '0.1',

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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: 'custom',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                '@common/wallet-core/send/composeSendFormTransactionThunk',
                (_, { fulfillWithValue }) => fulfillWithValue(levels),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
                recalculateCustomLimit: true,
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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: undefined,
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                '@common/wallet-core/send/composeSendFormTransactionThunk',
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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                '@common/wallet-core/send/composeSendFormTransactionThunk',
                (_, { rejectWithValue }) => rejectWithValue({ error: 'fee-levels-compose-failed' }),
            ),
        );

        const response = await store.dispatch(
            tradingThunks.recomposeAndSignTxThunk({
                account,
                address: 'address',
                amount: '0.1',
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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks({
            composedTransactionInfo: {
                ...mockComposedTransactionInfo,
                selectedFee: 'economy',
            },
        });

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                '@common/wallet-core/send/composeSendFormTransactionThunk',
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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                '@common/wallet-core/send/composeSendFormTransactionThunk',
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
        const { store, account, mockSignAndPushSendFormTransaction } = getMocks();

        (composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock).mockImplementationOnce(
            createThunk(
                '@common/wallet-core/send/composeSendFormTransactionThunk',
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
        const { store, account } = getMocks({
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
                '@common/wallet-core/send/composeSendFormTransactionThunk',
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            data: {},
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
                ethereumDataHex: '0x123456',
                ethereumAdjustGasLimit: '1',
                setMaxOutputId: 0,
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
        const { store, account } = getMocks({
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
                '@common/wallet-core/send/composeSendFormTransactionThunk',
                (_, { fulfillWithValue }) =>
                    fulfillWithValue({
                        normal: {
                            type: 'final',
                            feeLimit: '1111',
                        },
                        custom: {
                            type: 'final',
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
});
