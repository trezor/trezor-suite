import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';

import { buyThunks } from '../';
import { ALTERNATIVE_QUOTES } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { TradingBuyFormProps, TradingCryptoSelectItemProps } from '../../../types';
import { MIN_MAX_QUOTES_OK } from '../../../utils/buy/__fixtures__/buyUtils';
import { HandleRequestThunkProps } from '../handleRequestThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('Testing handleRequestThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
                        ...initialState,
                        info: {
                            ...initialState.info,
                            coins: {
                                bitcoin: {
                                    symbol: 'btc',
                                    name: 'Bitcoin',
                                    coingeckoId: 'bitcoin',
                                    services: {
                                        buy: true,
                                        sell: false,
                                        exchange: false,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const mockTimerLoading = jest.fn();
        const mockTimerStop = jest.fn();
        const mockTimerReset = jest.fn();
        const mockTimer = {
            loading: mockTimerLoading,
            stop: mockTimerStop,
            reset: mockTimerReset,
        } as unknown as HandleRequestThunkProps['timer'];

        const mockAbort = jest.fn();
        const mockAbortController: AbortController = {
            abort: mockAbort,
            signal: {} as AbortSignal,
        };
        jest.spyOn(global, 'AbortController').mockImplementation(() => mockAbortController);
        const mockAbortControllerRef = {
            current: mockAbortController,
        };

        const formValues: TradingBuyFormProps = {
            fiatInput: '1000',
            cryptoInput: '0',
            currencySelect: {
                value: 'usd',
                label: 'USD',
            },
            cryptoSelect: {
                value: 'bitcoin' as CryptoId,
                label: 'Bitcoin',
                symbol: 'btc',
                contractAddress: null,
                type: 'currency',
            },
            countrySelect: {
                value: 'CZ',
                label: 'Czech Republic',
            },
            paymentMethod: {
                value: 'creditCard',
                label: 'Credit Card',
            },
            amountInCrypto: false,
        };
        const input: HandleRequestThunkProps = {
            formValues,
            turnOffLoading: false,
            network: getNetwork('btc'),
            timer: mockTimer,
            shouldSendInSats: false,
            abortControllerRef: mockAbortControllerRef,
        };

        return {
            input,
            mockTimerLoading,
            mockTimerStop,
            mockTimerReset,
            mockAbort,
            mockAbortControllerRef,
            store,
        };
    };

    it('successful response', async () => {
        const { input, store, mockTimerLoading, mockTimerReset, mockAbort } = getMocks();

        invityAPI.getBuyQuotes = () =>
            Promise.resolve([...MIN_MAX_QUOTES_OK, ...ALTERNATIVE_QUOTES]);

        await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockAbort).toHaveBeenCalledTimes(1);
        expect(state.buy.amountLimits).toBeUndefined();
        expect(state.buy.quotes?.length).toEqual(2);
        expect(state.buy.quotesRequest).toEqual({
            country: 'CZ',
            cryptoStringAmount: '0',
            fiatCurrency: 'USD',
            fiatStringAmount: '1000',
            receiveCurrency: 'bitcoin',
            wantCrypto: false,
        });
        expect(state.info.paymentMethods.length).toEqual(1);
        expect(state.isLoading).toBe(false);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
    });

    it('unsuccessful response - incorrect fiatInput and cryptoInput', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
        const inputWithIncorrectData = {
            ...input,
            formValues: {
                ...input.formValues,
                fiatInput: undefined,
                cryptoInput: undefined,
            },
        };

        await store.dispatch(buyThunks.handleRequestThunk(inputWithIncorrectData)).unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });

    it('unsuccessful response - incorrect cryptoSelect', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
        const inputWithIncorrectData = {
            ...input,
            formValues: {
                ...input.formValues,
                cryptoSelect: undefined as unknown as TradingCryptoSelectItemProps,
            },
        };

        await store.dispatch(buyThunks.handleRequestThunk(inputWithIncorrectData)).unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });

    it('unsuccessful response - empty array in the response from API', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();

        invityAPI.getBuyQuotes = () => Promise.resolve([]);

        await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.buy.quotes?.length).toEqual(0);
        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });
});
