import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, SellFiatTrade } from 'invity-api';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
import { convertAmountUnitsToSubunits } from '@suite-common/wallet-utils';
import * as envUtils from '@trezor/env-utils';

import { sellThunks } from '../';
import { invityAPI } from '../../../invityAPI';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import {
    HandleSellRequestThunkProps,
    MinimalSellFormProps,
    TradingAssetSellOption,
    TradingSellFormProps,
} from '../../../types';
import { sellUtilsFixtures } from '../../../utils/sell/__fixtures__/sellUtils';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);
const mockedIsNative = jest.spyOn(envUtils, 'isNative');

describe('handleSellRequestThunk', () => {
    beforeEach(() => {
        mockedIsNative.mockReturnValue(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        mockedIsNative.mockRestore();
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
                                        buy: false,
                                        sell: true,
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
        } as unknown as HandleSellRequestThunkProps['timer'];

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
                accountKey: 'descriptor-btc-123' as AccountKey, // Todo: create properly via `createAccountKey()`
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
            timer: mockTimer,
            shouldSendInSats: false,
            composeRequestCallback: mockComposeRequestCallback,
        };

        return {
            input,
            mockTimerLoading,
            mockTimerStop,
            mockTimerReset,
            store,
        };
    };

    it('should successfully request sell quotes and save them', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = [...sellUtilsFixtures.MIN_MAX_QUOTES_OK];

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
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
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request sell quotes and save them with shouldSendInSats', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
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

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
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
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request sell quotes and save them when there is not currency in coins', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
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

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
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
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should request sell quotes and include subdivision when country has subdivisions and subdivision is selected', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
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

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
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
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should request sell quotes for US without subdivision on native', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        mockedIsNative.mockReturnValue(true);

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
                        countrySubdivisionSelect: undefined,
                    },
                }),
            )
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin',
            fiatCurrency: 'USD',
            country: 'US',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should not save quotes when country has subdivisions but no subdivision is selected', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
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
        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not save quotes when request is aborted', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();

        invityAPI.getSellQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(sellThunks.handleRequestThunk(input));

        promise.abort();

        await promise;

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });

    it('should not save quotes when output fiat amount and output amount are incorrect at the same time', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
        const incorrectData = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: input.formValues.outputs.map(output => ({
                    ...output,
                    fiat: undefined as unknown as string, // Invalid fiat amount
                    amount: undefined as unknown as string, // Invalid amount
                })),
            },
        };

        jest.spyOn(invityAPI, 'getSellQuotes');

        const promise = store.dispatch(sellThunks.handleRequestThunk(incorrectData));
        await promise;

        const state = store.getState().wallet.trading;

        expect(invityAPI.getSellQuotes).not.toHaveBeenCalled();
        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not proceed when requestData is null', async () => {
        const { input, store, mockTimerStop } = getMocks();

        const modifiedInput = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: [
                    {
                        ...input.formValues.outputs[0],
                        amount: undefined as unknown as string, // Invalid amount
                        fiat: undefined as unknown as string, // Invalid fiat
                    },
                ],
            },
        };

        const promise = store.dispatch(sellThunks.handleRequestThunk(modifiedInput));
        await promise;

        const state = store.getState().wallet.trading;

        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not save quotes when empty array is returned from the response', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();

        invityAPI.getSellQuotes = () => Promise.resolve([]);

        const quotesResponse = await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeDefined();
        expect(state.isLoading).toBe(false);
        expect(quotesResponse).toEqual([]);
    });

    it('should save quotes but not call composeRequestCallback when setMaxOutputId is defined', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const modifiedInput = {
            ...input,
            formValues: {
                ...input.formValues,
                setMaxOutputId: 0, // Simulate max balance computation
            },
        };

        const quotesResponse = await store
            .dispatch(sellThunks.handleRequestThunk(modifiedInput))
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(0); // Callback should not be called
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });
});
