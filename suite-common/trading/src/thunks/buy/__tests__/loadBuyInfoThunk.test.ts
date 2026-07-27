import { combineReducers } from '@reduxjs/toolkit';
import {
    type BuyCryptoPaymentMethod,
    type BuyProviderInfo,
    type CryptoId,
    type FiatCurrenciesProps,
} from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';

import { invityAPI } from '../../../invityAPI';
import { buyInitialState, tradingBuyReducer } from '../../../reducers/buyReducer';
import { regional } from '../../../regional';
import { buyThunks } from '../index';

describe('loadBuyInfoThunk', () => {
    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const store = configureMockStore({
        extra: {},
        reducer: combineReducers({
            wallet: combineReducers({
                trading: combineReducers({
                    buy: tradingBuyReducer,
                }),
            }),
        }),
        preloadedState: {
            wallet: {
                trading: {
                    buy: buyInitialState,
                },
            },
        },
    });

    it('should load data when response is successful', async () => {
        const buyInfoAPI = {
            country: 'CZ',
            suggestedFiatCurrency: 'CZK',
            providers: [],
            defaultAmountsOfFiatCurrencies: {
                czk: 2500,
            } as FiatCurrenciesProps,
        };

        invityAPI.getBuyList = () => Promise.resolve(buyInfoAPI);

        const buyInfoData = await store.dispatch(buyThunks.loadInfoThunk()).unwrap();

        expect(buyInfoData).toEqual({
            buyInfo: {
                country: buyInfoAPI.country,
                providers: [],
                defaultAmountsOfFiatCurrencies: buyInfoAPI.defaultAmountsOfFiatCurrencies,
                suggestedFiatCurrency: buyInfoAPI.suggestedFiatCurrency,
            },
            providerInfos: {},
            supportedFiatCurrencies: [],
            supportedCryptoCurrencies: [],
        });
    });

    it('should load default data object when response is unsuccessful', async () => {
        invityAPI.getBuyList = () => Promise.resolve(undefined);

        const buyInfoData = await store.dispatch(buyThunks.loadInfoThunk()).unwrap();

        expect(buyInfoData).toEqual({
            buyInfo: {
                country: regional.UNKNOWN_COUNTRY,
                providers: [],
                defaultAmountsOfFiatCurrencies: {},
            },
            providerInfos: {},
            supportedFiatCurrencies: [],
            supportedCryptoCurrencies: [],
        });
    });

    it('should build supportedFiatCurrencies and supportedCryptoCurrencies from providers', async () => {
        const provider1: BuyProviderInfo = {
            name: 'PROVIDER 1',
            companyName: 'COMPANY 1',
            tradedCoins: ['bitcoin'] as CryptoId[],
            tradedFiatCurrencies: ['EUR'],
            logo: 'logo1',
            isActive: true,
            paymentMethods: [] as BuyCryptoPaymentMethod[],
            supportedCountries: [],
            supportedSubdivisions: {},
        };

        const buyInfoAPI = {
            country: 'CZ',
            suggestedFiatCurrency: 'CZK',
            providers: [provider1] as BuyProviderInfo[],
            defaultAmountsOfFiatCurrencies: {
                czk: 2500,
            } as FiatCurrenciesProps,
        };

        invityAPI.getBuyList = () => Promise.resolve(buyInfoAPI);

        const buyInfoData = await store.dispatch(buyThunks.loadInfoThunk()).unwrap();

        expect(buyInfoData).toEqual(
            expect.objectContaining({
                providerInfos: {
                    'PROVIDER 1': provider1,
                },
                supportedFiatCurrencies: ['eur'],
                supportedCryptoCurrencies: ['bitcoin'],
            }),
        );
    });
});
