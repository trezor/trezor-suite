import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';

import { buyThunks } from '../../';
import { ALTERNATIVE_QUOTES } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import {
    HandleBuyRequestThunkProps,
    TradingBuyFormProps,
    TradingCryptoSelectItemProps,
} from '../../../types';
import { MIN_MAX_QUOTES_OK } from '../../../utils/buy/__fixtures__/buyUtils';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('handleBuyRequestThunk', () => {
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
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
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
        } as unknown as HandleBuyRequestThunkProps['timer'];

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
        const input: HandleBuyRequestThunkProps = {
            formValues,
            network: getNetwork('btc'),
            timer: mockTimer,
            shouldSendInSats: false,
        };

        return {
            input,
            mockTimerLoading,
            mockTimerStop,
            mockTimerReset,
            store,
        };
    };

    it('should successfully request quotes and save them', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = [...MIN_MAX_QUOTES_OK, ...ALTERNATIVE_QUOTES];

        invityAPI.getBuyQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
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
        expect(quotesResponse).toEqual([mockQuotes[1], mockQuotes[6]]);
    });

    it.each([
        [
            'incorrect fiatInput and cryptoInput',
            {
                fiatInput: undefined,
                cryptoInput: undefined,
            },
        ],
        [
            'incorrect cryptoSelect',
            {
                cryptoSelect: undefined as unknown as TradingCryptoSelectItemProps,
            },
        ],
    ])('should not save quotes when %s', async (_, incorrectFormValues) => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
        const inputWithIncorrectData = {
            ...input,
            formValues: {
                ...input.formValues,
                ...incorrectFormValues,
            },
        };

        const promise = store.dispatch(buyThunks.handleRequestThunk(inputWithIncorrectData));
        await promise;

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.buy.quotes?.length).toEqual(0);
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should save empty quotes when empty array is returned from in the response', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();

        invityAPI.getBuyQuotes = () => Promise.resolve([]);

        const quotesResponse = await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.buy.quotes?.length).toEqual(0);
        expect(state.buy.quotesRequest).toEqual({
            country: 'CZ',
            cryptoStringAmount: '0',
            fiatCurrency: 'USD',
            fiatStringAmount: '1000',
            receiveCurrency: 'bitcoin',
            wantCrypto: false,
        });
        expect(state.isLoading).toBe(false);
        expect(quotesResponse).toEqual([]);
    });

    it('should not save quotes, when request is aborted', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();

        invityAPI.getBuyQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(buyThunks.handleRequestThunk(input));

        promise.abort();
        await promise;

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.buy.quotes?.length).toEqual(0);
        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual({
            message: 'Aborted',
            name: 'AbortError',
        });
    });
});
