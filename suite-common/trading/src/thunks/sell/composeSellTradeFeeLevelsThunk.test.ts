import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { prepareDeviceReducer } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';
import {
    blockchainInitialState,
    composeSendFormTransactionFeeLevelsThunk,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import {
    type FeesState,
    type PrecomposedLevels,
    type PrecomposedTransaction,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { createThunk } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import {
    type ComposeSellTradeFeeLevelsThunkProps,
    type ComposeSellTradeFeeLevelsThunkState,
} from './composeSellTradeFeeLevelsThunk';
import { mockSellFiatTrade } from '../../../mocks/mockSellFiatTrade';
import { mockSellFormValues } from '../../../mocks/mockSellFormValues';
import {
    type TradingComposedTransactionInfo,
    type TradingState,
    initialState,
} from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { composeCryptoId } from '../../utils';

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

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

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

const composedTransactionInfo: TradingComposedTransactionInfo = {
    composed: { feePerByte: '10', feeLimit: '1000', estimatedFeeLimit: '1000', fee: '1000' },
    selectedFee: 'normal',
};

const LEVEL_BASE = { totalSpent: '42000', fee: '42000', feePerByte: '2', bytes: 0, inputs: [] };
const FINAL_LEVEL: PrecomposedTransaction = {
    ...LEVEL_BASE,
    type: 'final',
    outputs: [],
    outputsPermutation: [],
    feeLimit: '21000',
};
const NONFINAL_LEVEL: PrecomposedTransaction = {
    ...LEVEL_BASE,
    type: 'nonfinal',
    max: undefined,
    feeLimit: '21000',
};
const ERROR_LEVEL: PrecomposedTransaction = { type: 'error', error: 'NOT-ENOUGH-FUNDS' };

const QUOTE = mockSellFiatTrade({
    orderId: 'orderId',
    fiatStringAmount: '70',
    cryptoCurrency: composeCryptoId('ethereum'),
    cryptoStringAmount: '0.03',
    destinationAddress: 'partnerPayinAddress',
    destinationPaymentExtraId: 'destinationPaymentExtraId',
});

const FORM_PLACEHOLDER_ADDRESS = 'formPlaceholderAddress';

const getFormValues = (address: string) =>
    mockSellFormValues({ outputs: [{ ...DEFAULT_PAYMENT, address, amount: '0.03' }] });

const composeMock = composeSendFormTransactionFeeLevelsThunk as unknown as jest.Mock;

const mockComposedLevels = (levels: PrecomposedLevels) => {
    composeMock.mockImplementationOnce(
        createThunk(
            composeSendFormTransactionFeeLevelsThunk.typePrefix,
            (_, { fulfillWithValue }) => fulfillWithValue(levels),
        ),
    );
};

const mockComposeRejection = () => {
    composeMock.mockImplementationOnce(
        createThunk(composeSendFormTransactionFeeLevelsThunk.typePrefix, (_, { rejectWithValue }) =>
            rejectWithValue({ error: 'fee-levels-compose-failed' }),
        ),
    );
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
                    sell: { ...initialState.sell, selectedQuote: QUOTE },
                    ...tradingState,
                },
            },
            device: { devices: [mockSuiteDevice()], selectedDevice: mockSuiteDevice() },
        },
    }).services.store;

const getSellState = (sellState: Partial<TradingState['sell']>): Partial<TradingState> => ({
    sell: { ...initialState.sell, selectedQuote: QUOTE, ...sellState },
});

const composeProps: ComposeSellTradeFeeLevelsThunkProps = {
    account,
    decimals: 18,
    shouldSendInSats: undefined,
};

const compose = (store: ReturnType<typeof getStore>) =>
    store.dispatch(sellThunks.composeTradeFeeLevelsThunk(composeProps));

describe('composeSellTradeFeeLevelsThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('composes the trade from the partner payin address and stores the selected level', async () => {
        const store = getStore();
        mockComposedLevels({ normal: FINAL_LEVEL });

        await compose(store);

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
            composed: FINAL_LEVEL,
        });
    });

    it('does not store the result of a compose that was aborted while in flight', async () => {
        const store = getStore();
        mockComposedLevels({ normal: FINAL_LEVEL });

        const request = compose(store);
        request.abort();
        await request;
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(composeMock).toHaveBeenCalledTimes(1);
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('keeps the composed transaction when the level fails to compose', async () => {
        const store = getStore();
        mockComposedLevels({ normal: ERROR_LEVEL });

        await compose(store);

        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('estimates with the trade form address before the partner has sent its payin address', async () => {
        const store = getStore(
            getSellState({
                selectedQuote: { ...QUOTE, destinationAddress: undefined },
                formValues: getFormValues(FORM_PLACEHOLDER_ADDRESS),
            }),
        );
        mockComposedLevels({ normal: FINAL_LEVEL });

        await compose(store);

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [expect.objectContaining({ address: FORM_PLACEHOLDER_ADDRESS })],
                }),
                composeContext: expect.objectContaining({ assumeNewAccount: true }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed: FINAL_LEVEL,
        });
    });

    it('stores the nonfinal estimate composed without a recipient', async () => {
        const store = getStore(
            getSellState({
                selectedQuote: { ...QUOTE, destinationAddress: undefined },
                formValues: getFormValues(''),
            }),
        );
        mockComposedLevels({ normal: NONFINAL_LEVEL });

        await compose(store);

        expect(composeMock).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [expect.objectContaining({ address: '', amount: '0.03' })],
                }),
            }),
        );
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual({
            selectedFee: 'normal',
            composed: NONFINAL_LEVEL,
        });
    });

    it('keeps the composed transaction when the compose is rejected', async () => {
        const store = getStore();
        mockComposeRejection();

        await compose(store);

        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });

    it('does not compose without a stored fee level', async () => {
        const store = getStore({
            composedTransactionInfo: { composed: composedTransactionInfo.composed },
        });

        await compose(store);

        expect(composeMock).not.toHaveBeenCalled();
    });

    it('does not compose without any address', async () => {
        const store = getStore(
            getSellState({ selectedQuote: { ...QUOTE, destinationAddress: undefined } }),
        );

        await compose(store);

        expect(composeMock).not.toHaveBeenCalled();
        expect(store.getState().wallet.trading.composedTransactionInfo).toEqual(
            composedTransactionInfo,
        );
    });
});
