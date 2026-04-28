import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type SellFiatTrade } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';

import { sellThunks } from '../';
import { invityAPI } from '../../../invityAPI';
import {
    type QuoteRefetchingState,
    REFETCH_QUOTES_MAX_COUNT,
    initialState,
} from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import {
    type HandleSellRequestThunkProps,
    type MinimalSellFormProps,
    type TradingAssetSellOption,
    type TradingSellFormProps,
} from '../../../types';
import { sellUtilsFixtures } from '../../../utils/sell/__fixtures__/sellUtils';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

describe('handleSellRequestThunk', () => {
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
                                        buy: false,
                                        sell: true,
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

        const mockComposeRequestCallback = jest.fn();

        const formValues: TradingSellFormProps = {
            outputs: [
                {
                    type: 'payment',
                    address: 'address',
                    amount: '0.0015',
                    fiat: '50',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            countrySelect: {
                value: 'CZ' as const,
                codeAlpha3: 'CZE',
                flag: '🇨🇿',
                name: 'Czechia',
                label: '🇨🇿 Czechia',
                shortLabel: '🇨🇿 CZE',
            },
            sendCryptoSelect: {
                id: 'bitcoin' as CryptoId,
                isNativeToken: true,
                name: 'Bitcoin',
                coingeckoId: 'bitcoin',
                contractAddress: null,
                symbol: 'btc',
                displaySymbol: 'BTC',
                networkName: 'Bitcoin',
                networkSymbol: 'btc',
                accountKey: 'descriptor-btc-123' as AccountKey,
            } satisfies TradingAssetSellOption,
            amountInCrypto: true,
            feePerUnit: '',
            feeLimit: '',
            options: ['broadcast'],
            bitcoinLocktimeBlockHeight: '',
            bitcoinLocktimeDatetime: '',
            ethereumNonce: '',
            ethereumDataAscii: '',
            transactionData: '',
            destinationTag: '',
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            utxoSorting: 'newestFirst',
            selectedUtxos: [],
        };

        const input: HandleSellRequestThunkProps = {
            formValues,
            network: getNetwork('btc'),
            shouldSendInSats: false,
            composeRequestCallback: mockComposeRequestCallback,
        };

        return {
            input,
            store,
        };
    };

    it('should successfully request sell quotes and save them', async () => {
        const { input, store } = getMocks();
        const mockQuotes = [...sellUtilsFixtures.MIN_MAX_QUOTES_OK];

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

        expect(state.sell.amountLimits).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin',
            fiatCurrency: 'USD',
            country: 'CZ',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
        expect(state.quoteRefetchingState.status).toBe('running');
        expect(state.quoteRefetchingState.lastFetchTimestamp).toBeGreaterThan(0);
    });

    it('should successfully request sell quotes and save them with shouldSendInSats', async () => {
        const { input, store } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                sellThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        outputs: input.formValues.outputs.map(output => ({
                            ...output,
                            amount: convertAmountUnitsToSubunits(output.amount!, 8),
                        })),
                    },
                    shouldSendInSats: true,
                }),
            )
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(state.sell.amountLimits).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin',
            fiatCurrency: 'USD',
            country: 'CZ',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request sell quotes and save them when there is not currency in coins', async () => {
        const { input, store } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            cryptoCurrency: 'ethereum',
            orderId: undefined,
        })) as SellFiatTrade[];

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                sellThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        outputs: input.formValues.outputs.map(output => ({
                            ...output,
                        })),
                        sendCryptoSelect: {
                            ...input.formValues.sendCryptoSelect,
                            id: 'ethereum' as CryptoId,
                        },
                    } satisfies MinimalSellFormProps,
                }),
            )
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(state.sell.amountLimits).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'ethereum',
            fiatCurrency: 'USD',
            country: 'CZ',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should request sell quotes and include subdivision when country has subdivisions and subdivision is selected', async () => {
        const { input, store } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                sellThunks.handleRequestThunk({
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

        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin',
            fiatCurrency: 'USD',
            country: 'US',
            subdivision: 'CA',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(state.isLoading).toBe(false);
    });

    it('should not save quotes when country has subdivisions but no subdivision is selected', async () => {
        const { input, store } = getMocks();
        const incorrectData = {
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
        };

        jest.spyOn(invityAPI, 'getSellQuotes');

        const promise = store.dispatch(sellThunks.handleRequestThunk(incorrectData));
        await promise;

        const state = store.getState().wallet.trading;

        expect(invityAPI.getSellQuotes).not.toHaveBeenCalled();
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not save quotes when request is aborted', async () => {
        const { input, store } = getMocks();

        invityAPI.getSellQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(sellThunks.handleRequestThunk(input));

        promise.abort();

        await promise;

        const state = store.getState().wallet.trading;

        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        expect(state.quoteRefetchingState.status).toBe('stopped');
        expect(state.quoteRefetchingState.lastFetchTimestamp).toBeUndefined();
    });

    it('should not save quotes when output fiat amount and output amount are incorrect at the same time', async () => {
        const { input, store } = getMocks();
        const incorrectData = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: input.formValues.outputs.map(output => ({
                    ...output,
                    fiat: undefined as unknown as string,
                    amount: undefined as unknown as string,
                })),
            },
        };

        jest.spyOn(invityAPI, 'getSellQuotes');

        const promise = store.dispatch(sellThunks.handleRequestThunk(incorrectData));
        await promise;

        const state = store.getState().wallet.trading;

        expect(invityAPI.getSellQuotes).not.toHaveBeenCalled();
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not proceed when requestData is null', async () => {
        const { input, store } = getMocks();

        const modifiedInput = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: [
                    {
                        ...input.formValues.outputs[0],
                        amount: undefined as unknown as string,
                        fiat: undefined as unknown as string,
                    },
                ],
            },
        };

        const promise = store.dispatch(sellThunks.handleRequestThunk(modifiedInput));
        await promise;

        const state = store.getState().wallet.trading;

        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not save quotes when empty array is returned from the response', async () => {
        const { input, store } = getMocks();

        invityAPI.getSellQuotes = () => Promise.resolve([]);

        const quotesResponse = await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeDefined();
        expect(state.isLoading).toBe(false);
        expect(quotesResponse).toEqual([]);
        expect(state.quoteRefetchingState.status).toBe('stopped');
        expect(state.quoteRefetchingState.lastFetchTimestamp).toBeUndefined();
    });

    it('should save quotes but not call composeRequestCallback when setMaxOutputId is defined', async () => {
        const { input, store } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const modifiedInput = {
            ...input,
            formValues: {
                ...input.formValues,
                setMaxOutputId: 0,
            },
        };

        const quotesResponse = await store
            .dispatch(sellThunks.handleRequestThunk(modifiedInput))
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(0);
        expect(state.isLoading).toBe(false);
    });

    it('should set refetch timestamp and decrement remaining refetches on success when refetch is running', async () => {
        const { input, store } = getMocks({ status: 'running' });
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({ ...quote }));
        const beforeTimestamp = Date.now();

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const { quoteRefetchingState: refetchQuotes } = store.getState().wallet.trading;

        expect(refetchQuotes.status).toBe('running');
        expect(refetchQuotes.lastFetchTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
        expect(refetchQuotes.remainingRefetches).toBe(REFETCH_QUOTES_MAX_COUNT - 1);
    });

    it('should stop refetch when last remaining refetch is consumed on success', async () => {
        const { input, store } = getMocks({ status: 'running', remainingRefetches: 1 });
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({ ...quote }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

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
            sellThunks.handleRequestThunk({
                ...input,
                formValues: {
                    ...input.formValues,
                    outputs: input.formValues.outputs.map(output => ({
                        ...output,
                        fiat: undefined as unknown as string,
                        amount: undefined as unknown as string,
                    })),
                },
            }),
        );
        await promise;

        const { quoteRefetchingState: refetchQuotes } = store.getState().wallet.trading;

        expect(refetchQuotes.status).toBe('stopped');
        expect(refetchQuotes.remainingRefetches).toBe(REFETCH_QUOTES_MAX_COUNT);
        expect(refetchQuotes.lastFetchTimestamp).toBeUndefined();
    });
});
