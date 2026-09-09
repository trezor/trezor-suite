import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { type ExchangeTrade } from 'invity-api';

import { prepareDeviceReducer } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import {
    blockchainInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Account, type FeesState } from '@suite-common/wallet-types';

import { MIN_MAX_QUOTES_OK } from '../../__fixtures__/exchangeUtils';
import { accountEth } from '../../__fixtures__/utils';
import { type TradingState, initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';

import { exchangeThunks } from './index';

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

const account = accountEth as Account;

const fees: FeesState = {
    [account.symbol]: {
        status: 'loaded',
        data: {
            blockHeight: 890366,
            blockTime: 10,
            minFee: 1,
            maxFee: 100,
            minPriorityFee: 0,
            dustLimit: 546,
            levels: [{ label: 'normal', feePerUnit: '2', blocks: 2 }],
        },
    },
};
const feesReducer = createReducer({ ...fees }, () => {});

const composedTransactionInfo = {
    composed: {
        feePerByte: '10',
        feeLimit: '1000',
        estimatedFeeLimit: '1000',
        fee: '1000',
        token: undefined,
        outputs: [],
    },
    selectedFee: 'normal' as const,
};

const composeMock = composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock;

const mockComposedLevels = (levels: unknown) => {
    composeMock.mockImplementationOnce(
        createThunk(
            composeSendFormTransactionFeeLevelsThunk.typePrefix,
            (_, { fulfillWithValue }) => fulfillWithValue(levels),
        ),
    );
};

const mockComposeRejection = (message: string) => {
    composeMock.mockImplementationOnce(
        createThunk(composeSendFormTransactionFeeLevelsThunk.typePrefix, (_, { rejectWithValue }) =>
            rejectWithValue({ message }),
        ),
    );
};

const getCexQuote = (): ExchangeTrade => {
    const quote = MIN_MAX_QUOTES_OK[0];
    if (!quote) throw new Error('Missing test fixture');

    return {
        ...quote,
        orderId: 'orderId',
        sendAddress: 'partnerPayinAddress',
        sendStringAmount: '0.03',
        partnerPaymentExtraId: 'partnerPaymentExtraId',
    };
};

const getDexQuote = (): ExchangeTrade => ({
    ...getCexQuote(),
    isDex: true,
    status: 'CONFIRM',
    receiveAddress: 'receiveAddress',
    dexTx: {
        from: 'from',
        to: 'dexContractAddress',
        data: '0xdexdata',
        value: '30000000000000000',
    },
});

const getStore = (tradingState?: Partial<TradingState>) =>
    createTestStore({
        extra: undefined,
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: () => [account],
                blockchain: () => blockchainInitialState,
                fees: feesReducer,
                settings: () => initialWalletSettingsState,
                trading: tradingReducer,
            }),
            device: deviceReducer,
        }),
        preloadedState: {
            wallet: {
                trading: {
                    ...initialState,
                    composedTransactionInfo,
                    ...tradingState,
                },
            },
            device: { devices: [mockSuiteDevice()], selectedDevice: mockSuiteDevice() },
        },
    });

const getExchangeState = (selectedQuote: ExchangeTrade): Partial<TradingState> => ({
    exchange: { ...initialState.exchange, selectedQuote },
});

describe('composeExchangeTradeFeeLevelsThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('composes a CEX trade from the partner payin address and stores the selected level', async () => {
        const store = getStore(getExchangeState(getCexQuote()));
        const composed = { type: 'final', fee: '42000', feeLimit: '21000' };
        mockComposedLevels({ normal: composed });

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [
                        expect.objectContaining({
                            address: 'partnerPayinAddress',
                            amount: '0.03',
                        }),
                    ],
                    destinationTag: 'partnerPaymentExtraId',
                    transactionData: undefined,
                    ethereumAdjustGasLimit: undefined,
                    selectedFee: 'normal',
                }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed,
        });
    });

    it('composes a DEX trade from the transaction data with the adjusted gas limit', async () => {
        const store = getStore(getExchangeState(getDexQuote()));
        const composed = { type: 'final', fee: '84000', feeLimit: '42000' };
        mockComposedLevels({ normal: composed });

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [
                        expect.objectContaining({
                            address: 'dexContractAddress',
                            amount: '30000000000000000',
                        }),
                    ],
                    transactionData: '0xdexdata',
                    ethereumAdjustGasLimit: '1.25',
                }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed,
        });
    });

    it('recalculates the gas limit of a DEX trade with a custom fee level', async () => {
        const store = getStore({
            ...getExchangeState(getDexQuote()),
            composedTransactionInfo: { ...composedTransactionInfo, selectedFee: 'custom' },
        });
        mockComposedLevels({ normal: { type: 'final', feeLimit: '50000' } });
        mockComposedLevels({ custom: { type: 'final', fee: '100000', feeLimit: '50000' } });

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(composeMock).toHaveBeenCalledTimes(2);
        expect(composeMock).toHaveBeenLastCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({ selectedFee: 'custom', feeLimit: '50000' }),
            }),
        );
    });

    it('leaves the stored level untouched when the custom limit recalculation is rejected', async () => {
        const storedInfo = { ...composedTransactionInfo, selectedFee: 'custom' as const };
        const store = getStore({
            ...getExchangeState(getDexQuote()),
            composedTransactionInfo: storedInfo,
        });
        mockComposeRejection('Method_InvalidParameter');

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(storedInfo);
    });

    it('leaves the stored level untouched when the custom level cannot recalculate its gas limit', async () => {
        const storedInfo = { ...composedTransactionInfo, selectedFee: 'custom' as const };
        const store = getStore({
            ...getExchangeState(getDexQuote()),
            composedTransactionInfo: storedInfo,
        });
        mockComposedLevels({ normal: { type: 'error', error: 'NOT-ENOUGH-FUNDS' } });

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(composeMock).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(storedInfo);
    });

    it('keeps the composed transaction when the level fails to compose', async () => {
        const store = getStore(getExchangeState(getCexQuote()));
        mockComposedLevels({ normal: { type: 'error', error: 'NOT-ENOUGH-FUNDS' } });

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('does not compose a quote that is signed as EIP-712 typed data', async () => {
        const quote: ExchangeTrade = {
            ...getDexQuote(),
            signData: { type: 'eip712-typed-data', data: {} },
        };
        const store = getStore(getExchangeState(quote));

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(composeMock).not.toHaveBeenCalled();
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('does not compose before the form has stored a composed transaction', async () => {
        const store = getStore({
            ...getExchangeState(getCexQuote()),
            composedTransactionInfo: {},
        });

        await store.dispatch(
            exchangeThunks.composeTradeFeeLevelsThunk({
                account,
                decimals: 18,
                shouldSendInSats: undefined,
            }),
        );

        expect(composeMock).not.toHaveBeenCalled();
    });
});
