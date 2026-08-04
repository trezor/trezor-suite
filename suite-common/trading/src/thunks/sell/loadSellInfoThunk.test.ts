import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type SellListResponse, type SellProviderInfo } from 'invity-api';

import { createTestStore } from '@suite-common/test-utils';

import { sellInitialState, tradingSellReducer } from '../../reducers/sellReducer';
import { regional } from '../../regional';
import { tradeApi } from '../../tradeApi';

import { sellThunks } from './index';

describe('loadSellInfoThunk', () => {
    jest.mock('../../tradeApi');

    tradeApi.setServersEnvironment = () => {};
    tradeApi.createApiKey = () => {};

    const sellProvider: SellProviderInfo = {
        name: 'test',
        companyName: 'Test',
        logo: 'test.jpg',
        isActive: true,
        statusUrl: 'https://test.io/sell/txs/{{orderId}}',
        supportUrl: 'https://support.test.io',
        tradedCoins: ['bitcoin' as CryptoId],
        tradedFiatCurrencies: ['CZK', 'USD'],
        type: 'Fiat',
        supportedCountries: ['CZ'],
        supportedSubdivisions: {},
    };

    const store = createTestStore({
        extra: undefined,
        reducer: combineReducers({
            wallet: combineReducers({
                trading: combineReducers({
                    sell: tradingSellReducer,
                }),
            }),
        }),
        preloadedState: {
            wallet: {
                trading: {
                    sell: sellInitialState,
                },
            },
        },
    });

    it('should load data when response is successful', async () => {
        const sellInfoApi: SellListResponse = {
            providers: [sellProvider],
            country: 'CZ',
        };

        tradeApi.getSellList = () => Promise.resolve(sellInfoApi);

        const sellInfoData = await store.dispatch(sellThunks.loadInfoThunk()).unwrap();

        expect(sellInfoData).toEqual({
            providerInfos: {
                [sellProvider.name]: sellProvider,
            },
            supportedFiatCurrencies:
                sellProvider.tradedFiatCurrencies?.map(currency => currency.toLowerCase()) ?? [],
            supportedCryptoCurrencies: sellProvider.tradedCoins,
            country: sellInfoApi.country,
        });
    });

    it('should load data when response is successful with undefined tradedFiatCurrencies', async () => {
        const sellProviderUpdated = {
            ...sellProvider,
            tradedFiatCurrencies: undefined,
        };
        const sellInfoApi: SellListResponse = {
            providers: [sellProviderUpdated],
            country: 'CZ',
        };

        tradeApi.getSellList = () => Promise.resolve(sellInfoApi);

        const sellInfoData = await store.dispatch(sellThunks.loadInfoThunk()).unwrap();

        expect(sellInfoData).toEqual({
            providerInfos: {
                [sellProviderUpdated.name]: sellProviderUpdated,
            },
            supportedFiatCurrencies: [],
            supportedCryptoCurrencies: sellProviderUpdated.tradedCoins,
            country: sellInfoApi.country,
        });
    });

    it('does not throw on a poison provider missing tradedCoins (untrusted trade server)', async () => {
        // untrusted trade server returns a provider that omits tradedCoins (typed non-optional) and
        // includes a non-string fiat currency; without a guard `.forEach`/`.toLowerCase()` throws and
        // rejects the thunk, leaving the trading feature stuck loading for the whole session.
        const poisonProvider = {
            ...sellProvider,
            name: 'poison',
            tradedCoins: undefined,
            tradedFiatCurrencies: ['CZK', 123],
        } as unknown as SellProviderInfo;

        const sellInfoApi: SellListResponse = {
            providers: [poisonProvider, sellProvider],
            country: 'CZ',
        };

        tradeApi.getSellList = () => Promise.resolve(sellInfoApi);

        const sellInfoData = await store.dispatch(sellThunks.loadInfoThunk()).unwrap();

        // poison provider's non-string currency dropped and missing tradedCoins skipped; the valid
        // provider's entries survive (unique() dedupes czk shared with the poison provider)
        expect(sellInfoData).toEqual({
            providerInfos: {
                poison: poisonProvider,
                [sellProvider.name]: sellProvider,
            },
            supportedFiatCurrencies: ['czk', 'usd'],
            supportedCryptoCurrencies: ['bitcoin'],
            country: sellInfoApi.country,
        });
    });

    it('should load default data object when response is unsuccessful', async () => {
        tradeApi.getSellList = () => Promise.resolve(undefined as unknown as SellListResponse);

        const sellInfoData = await store.dispatch(sellThunks.loadInfoThunk()).unwrap();

        expect(sellInfoData).toEqual({
            providerInfos: {},
            supportedFiatCurrencies: [],
            supportedCryptoCurrencies: [],
            country: regional.UNKNOWN_COUNTRY,
        });
    });
});
