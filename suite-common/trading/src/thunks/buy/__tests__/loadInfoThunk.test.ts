import { combineReducers } from '@reduxjs/toolkit';
import { BuyCryptoPaymentMethod, BuyProviderInfo, CryptoId, FiatCurrenciesProps } from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';

import { buyThunks } from '../../';
import { invityAPI } from '../../../invityAPI';
import { buyInitialState } from '../../../reducers/__fixtures__/buyTradingReducer';
import { tradingBuyReducer } from '../../../reducers/buyReducer';
import { regional } from '../../../regional';

describe('loadInfoThunk', () => {
    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const store = configureMockStore({
        extra: {},
        reducer: combineReducers({
            wallet: combineReducers({
                tradingNew: combineReducers({
                    buy: tradingBuyReducer,
                }),
            }),
        }),
        preloadedState: {
            wallet: {
                tradingNew: {
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
