import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type SellListResponse, type SellProviderInfo } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';

import {
    type TradingSellState,
    sellInitialState,
    tradingSellReducer,
} from '../../reducers/sellReducer';
import { regional } from '../../regional';
import { tradeApi } from '../../tradeApi';

import { sellThunks } from './index';

// The thunk has no state dependency; this slice is needed to assert its reducer updates.
type State = { wallet: { trading: { sell: TradingSellState } } };

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

    const { store } = createTestCompositionRoot<void, State>({
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
    }).services;

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
