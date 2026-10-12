import { combineReducers, createReducer } from '@reduxjs/toolkit';
import { type SellFiatTrade } from 'invity-api';

import { prepareDeviceReducer } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    blockchainInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import { type Account, type FeesState } from '@suite-common/wallet-types';

import { type ComposeSellTradeFeeLevelsThunkState } from './composeSellTradeFeeLevelsThunk';
import { MIN_MAX_QUOTES_HIGH } from '../../__fixtures__/sellUtils';
import { accountEth } from '../../__fixtures__/utils';
import { type TradingState, initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { type TradingSellFormProps } from '../../types';

import { sellThunks } from './index';

jest.mock('@suite-common/wallet-core', () => {
    const actualModule = jest.requireActual('@suite-common/wallet-core');
    const actualCompose = actualModule.composeSendFormTransactionFeeLevelsThunk;
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

const getQuote = (): SellFiatTrade => {
    const quote = MIN_MAX_QUOTES_HIGH[0];
    if (!quote) throw new Error('Missing test fixture');

    return {
        ...quote,
        orderId: 'orderId',
        destinationAddress: 'partnerPayinAddress',
        cryptoStringAmount: '0.03',
        destinationPaymentExtraId: 'destinationPaymentExtraId',
    };
};

const getStore = (tradingState?: Partial<TradingState>) =>
    createTestCompositionRoot<void, ComposeSellTradeFeeLevelsThunkState>({
        reducer: combineReducers({
            wallet: combineReducers({
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
    }).services.store;

const getSellState = (selectedQuote: SellFiatTrade): Partial<TradingState> => ({
    sell: { ...initialState.sell, selectedQuote },
});

const composeProps = { account, decimals: 18, shouldSendInSats: undefined };

describe('composeSellTradeFeeLevelsThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('composes the trade from the partner payin address and stores the selected level', async () => {
        const store = getStore(getSellState(getQuote()));
        const composed = { type: 'final', fee: '42000', feeLimit: '21000' };
        mockComposedLevels({ normal: composed });

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [
                        expect.objectContaining({
                            address: 'partnerPayinAddress',
                            amount: '0.03',
                        }),
                    ],
                    destinationTag: 'destinationPaymentExtraId',
                    selectedFee: 'normal',
                }),
                composeContext: expect.objectContaining({ assumeNewAccount: false }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed,
        });
    });

    it('does not store the result of a compose that was aborted while in flight', async () => {
        const store = getStore(getSellState(getQuote()));
        mockComposedLevels({ normal: { type: 'final', fee: '42000', feeLimit: '21000' } });

        const request = store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));
        request.abort();
        await request;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(composeMock).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('keeps the composed transaction when the level fails to compose', async () => {
        const store = getStore(getSellState(getQuote()));
        mockComposedLevels({ normal: { type: 'error', error: 'NOT-ENOUGH-FUNDS' } });

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('estimates with the trade form address before the partner has sent its payin address', async () => {
        const formValues = {
            outputs: [{ address: 'formPlaceholderAddress', amount: '0.03' }],
        } as TradingSellFormProps;
        const store = getStore({
            sell: {
                ...initialState.sell,
                selectedQuote: { ...getQuote(), destinationAddress: undefined },
                formValues,
            },
        });
        const composed = { type: 'final', fee: '42000', feeLimit: '21000' };
        mockComposedLevels({ normal: composed });

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [expect.objectContaining({ address: 'formPlaceholderAddress' })],
                }),
                composeContext: expect.objectContaining({ assumeNewAccount: true }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed,
        });
    });

    it('stores the nonfinal estimate composed without a recipient', async () => {
        const formValues = {
            outputs: [{ address: '', amount: '0.03' }],
        } as TradingSellFormProps;
        const store = getStore({
            sell: {
                ...initialState.sell,
                selectedQuote: { ...getQuote(), destinationAddress: undefined },
                formValues,
            },
        });
        const composed = { type: 'nonfinal', fee: '42000', feeLimit: '21000' };
        mockComposedLevels({ normal: composed });

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [expect.objectContaining({ address: '', amount: '0.03' })],
                }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed,
        });
    });

    it('keeps the composed transaction when the compose is rejected', async () => {
        const store = getStore(getSellState(getQuote()));
        composeMock.mockImplementationOnce(
            createThunk(
                composeSendFormTransactionFeeLevelsThunk.typePrefix,
                (_, { rejectWithValue }) => rejectWithValue({ error: 'fee-levels-compose-failed' }),
            ),
        );

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('does not compose without a stored fee level', async () => {
        const store = getStore({
            ...getSellState(getQuote()),
            composedTransactionInfo: { composed: composedTransactionInfo.composed },
        });

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(composeMock).not.toHaveBeenCalled();
    });

    it('does not compose without any address', async () => {
        const store = getStore(getSellState({ ...getQuote(), destinationAddress: undefined }));

        await store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

        expect(composeMock).not.toHaveBeenCalled();
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });
});
