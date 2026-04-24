import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { isNative } from '@trezor/env-utils';

import { ALTERNATIVE_QUOTES } from '../../../__fixtures__/buyUtils';
import { invityAPI } from '../../../invityAPI';
import {
    type QuoteRefetchingState,
    REFETCH_QUOTES_MAX_COUNT,
    initialState,
} from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import {
    type HandleBuyRequestThunkProps,
    type TradingAssetOption,
    type TradingBuyFormProps,
} from '../../../types';
import { MIN_MAX_QUOTES_OK } from '../../../utils/buy/__fixtures__/buyUtils';
import { buyThunks } from '../index';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);
const createMockQuotes = () =>
    [...MIN_MAX_QUOTES_OK, ...ALTERNATIVE_QUOTES].map(quote => ({ ...quote }));
jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isNative: jest.fn(),
}));
const mockedIsNative = isNative as jest.Mock;

describe('handleBuyRequestThunk', () => {
    beforeEach(() => {
        mockedIsNative.mockReturnValue(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = (refetchQuotesOverride?: Partial<QuoteRefetchingState>) => {
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
                        quoteRefetchingState: {
                            ...initialState.quoteRefetchingState,
                            ...refetchQuotesOverride,
                        },
                    },
                },
            },
        });

        const formValues: TradingBuyFormProps = {
            fiatInput: '1000',
            cryptoInput: '0',
            currencySelect: {
                value: 'usd',
                label: 'USD',
            },
            cryptoSelect: {
                id: 'bitcoin' as CryptoId,
                isNativeToken: true,
                name: 'Bitcoin',
                symbol: 'btc',
                coingeckoId: 'bitcoin',
                displaySymbol: 'BTC',
                contractAddress: null,
                networkName: 'Bitcoin',
                networkSymbol: 'btc',
            } satisfies TradingAssetOption,
            countrySelect: {
                value: 'CZ',
                codeAlpha3: 'CZE',
                flag: '🇨🇿',
                name: 'Czechia',
                label: '🇨🇿 Czechia',
                shortLabel: '🇨🇿 CZE',
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
            shouldSendInSats: false,
        };

        return {
            input,
            store,
        };
    };

    it('should successfully request quotes and save them', async () => {
        const { input, store } = getMocks();
        const mockQuotes = createMockQuotes();

        invityAPI.getBuyQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

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
        expect(state.quoteRefetchingState.status).toBe('running');
        expect(state.quoteRefetchingState.lastFetchTimestamp).toBeGreaterThan(0);
        expect(quotesResponse).toEqual([
            expect.objectContaining(mockQuotes[1]),
            expect.objectContaining(mockQuotes[6]),
        ]);
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
                cryptoSelect: undefined as unknown as TradingAssetOption,
            },
        ],
        [
            'country with subdivisions but no subdivision selected',
            {
                countrySelect: {
                    value: 'US' as const,
                    codeAlpha3: 'USA',
                    flag: '🇺🇸',
                    name: 'United States of America',
                    label: '🇺🇸 United States',
                    shortLabel: '🇺🇸 USA',
                },
                countrySubdivisionSelect: undefined,
            },
        ],
    ])('should not save quotes when %s', async (_, incorrectFormValues) => {
        const { input, store } = getMocks();
        const inputWithIncorrectData = {
            ...input,
            formValues: {
                ...input.formValues,
                ...incorrectFormValues,
            },
        };

        const promise = store.dispatch(buyThunks.handleRequestThunk(inputWithIncorrectData));
        await promise;

        const state = store.getState().wallet.trading;

        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.buy.quotes?.length).toEqual(0);
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should request quotes and include subdivision when country has subdivisions and subdivision is selected', async () => {
        const { input, store } = getMocks();
        const mockQuotes = createMockQuotes();

        invityAPI.getBuyQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                buyThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        countrySelect: {
                            value: 'US' as const,
                            codeAlpha3: 'USA',
                            flag: '🇺🇸',
                            name: 'United States of America',
                            label: '🇺🇸 United States',
                            shortLabel: '🇺🇸 USA',
                        },
                        countrySubdivisionSelect: {
                            value: 'CA',
                            label: 'California',
                            name: 'California',
                        },
                    },
                }),
            )
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(state.buy.amountLimits).toBeUndefined();
        expect(state.buy.quotes?.length).toEqual(2);
        expect(state.buy.quotesRequest).toEqual({
            country: 'US',
            subdivision: 'CA',
            cryptoStringAmount: '0',
            fiatCurrency: 'USD',
            fiatStringAmount: '1000',
            receiveCurrency: 'bitcoin',
            wantCrypto: false,
        });
        expect(quotesResponse).toEqual([
            expect.objectContaining(mockQuotes[1]),
            expect.objectContaining(mockQuotes[6]),
        ]);
    });

    it('should request quotes for US without subdivision on native', async () => {
        const { input, store } = getMocks();
        const mockQuotes = createMockQuotes();

        mockedIsNative.mockReturnValue(true);

        invityAPI.getBuyQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                buyThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        countrySelect: {
                            value: 'US' as const,
                            codeAlpha3: 'USA',
                            flag: '🇺🇸',
                            name: 'United States of America',
                            label: '🇺🇸 United States',
                            shortLabel: '🇺🇸 USA',
                        },
                        countrySubdivisionSelect: undefined,
                    },
                }),
            )
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(state.buy.amountLimits).toBeUndefined();
        expect(state.buy.quotes?.length).toEqual(2);
        expect(state.buy.quotesRequest).toEqual({
            country: 'US',
            cryptoStringAmount: '0',
            fiatCurrency: 'USD',
            fiatStringAmount: '1000',
            receiveCurrency: 'bitcoin',
            wantCrypto: false,
        });
        expect(quotesResponse).toEqual([
            expect.objectContaining(mockQuotes[1]),
            expect.objectContaining(mockQuotes[6]),
        ]);
    });

    it('should save empty quotes when empty array is returned from in the response', async () => {
        const { input, store } = getMocks();

        invityAPI.getBuyQuotes = () => Promise.resolve([]);

        const quotesResponse = await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

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
        expect(state.quoteRefetchingState.status).toBe('stopped');
        expect(state.quoteRefetchingState.lastFetchTimestamp).toBeUndefined();
        expect(quotesResponse).toEqual([]);
    });

    it('should not save quotes, when request is aborted', async () => {
        const { input, store } = getMocks();

        invityAPI.getBuyQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(buyThunks.handleRequestThunk(input));

        promise.abort();
        await promise;

        const state = store.getState().wallet.trading;

        expect(state.buy.quotes?.length).toEqual(0);
        expect(state.buy.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        expect(state.quoteRefetchingState.status).toBe('stopped');
        expect(state.quoteRefetchingState.lastFetchTimestamp).toBeUndefined();
        await expect(() => promise.unwrap()).rejects.toEqual({
            message: 'Aborted',
            name: 'AbortError',
        });
    });

    it('should set refetch timestamp and decrement remaining refetches on success when refetch is running', async () => {
        const { input, store } = getMocks({ status: 'running' });
        const mockQuotes = createMockQuotes();
        const beforeTimestamp = Date.now();

        invityAPI.getBuyQuotes = () => Promise.resolve(mockQuotes);

        await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const { quoteRefetchingState: refetchQuotes } = store.getState().wallet.trading;

        expect(refetchQuotes.status).toBe('running');
        expect(refetchQuotes.lastFetchTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(refetchQuotes.remainingRefetches).toBe(REFETCH_QUOTES_MAX_COUNT - 1);
    });

    it('should stop refetch when last remaining refetch is consumed on success', async () => {
        const { input, store } = getMocks({ status: 'running', remainingRefetches: 1 });
        const mockQuotes = createMockQuotes();

        invityAPI.getBuyQuotes = () => Promise.resolve(mockQuotes);

        await store.dispatch(buyThunks.handleRequestThunk(input)).unwrap();

        const { quoteRefetchingState: refetchQuotes } = store.getState().wallet.trading;

        expect(refetchQuotes.status).toBe('stopped');
        expect(refetchQuotes.remainingRefetches).toBe(0);
        expect(refetchQuotes.lastFetchTimestamp).toBeDefined();
    });

    it('should reset refetch state when request data is invalid while refetch is running', async () => {
        const { input, store } = getMocks({
            status: 'running',
            remainingRefetches: 10,
            lastFetchTimestamp: Date.now(),
        });

        const promise = store.dispatch(
            buyThunks.handleRequestThunk({
                ...input,
                formValues: { ...input.formValues, fiatInput: undefined, cryptoInput: undefined },
            }),
        );
        await promise;

        const { quoteRefetchingState: refetchQuotes } = store.getState().wallet.trading;

        expect(refetchQuotes.status).toBe('stopped');
        expect(refetchQuotes.remainingRefetches).toBe(REFETCH_QUOTES_MAX_COUNT);
        expect(refetchQuotes.lastFetchTimestamp).toBeUndefined();
    });
});
