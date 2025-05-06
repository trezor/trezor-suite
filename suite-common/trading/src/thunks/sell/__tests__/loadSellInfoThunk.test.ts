import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, SellListResponse, SellProviderInfo } from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';

import { sellThunks } from '../../';
import { invityAPI } from '../../../invityAPI';
import { sellInitialState, tradingSellReducer } from '../../../reducers/sellReducer';
import { regional } from '../../../regional';

describe('loadSellInfoThunk', () => {
    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

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
    };

    const store = configureMockStore({
        extra: {},
        reducer: combineReducers({
            wallet: combineReducers({
                tradingNew: combineReducers({
                    sell: tradingSellReducer,
                }),
            }),
        }),
        preloadedState: {
            wallet: {
                tradingNew: {
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

        invityAPI.getSellList = () => Promise.resolve(sellInfoApi);

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

        invityAPI.getSellList = () => Promise.resolve(sellInfoApi);

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
        invityAPI.getSellList = () => Promise.resolve(undefined as unknown as SellListResponse);

        const sellInfoData = await store.dispatch(sellThunks.loadInfoThunk()).unwrap();

        expect(sellInfoData).toEqual({
            providerInfos: {},
            supportedFiatCurrencies: [],
            supportedCryptoCurrencies: [],
            country: regional.UNKNOWN_COUNTRY,
        });
    });
});
