import { combineReducers } from '@reduxjs/toolkit';
import {
    type BuyCryptoPaymentMethod,
    type BuyProviderInfo,
    type CryptoId,
    type FiatCurrenciesProps,
} from 'invity-api';

import { createTestStore } from '@suite-common/test-utils';

import { buyInitialState, tradingBuyReducer } from '../../reducers/buyReducer';
import { regional } from '../../regional';
import { tradeApi } from '../../tradeApi';

import { buyThunks } from './index';

describe('loadBuyInfoThunk', () => {
    jest.mock('../../tradeApi');

    tradeApi.setServersEnvironment = () => {};
    tradeApi.createApiKey = () => {};

    const store = createTestStore({
        extra: undefined,
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

        tradeApi.getBuyList = () => Promise.resolve(buyInfoAPI);

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
        tradeApi.getBuyList = () => Promise.resolve(undefined);

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

    it('returns the default data object when providers is a truthy non-array (untrusted trade server)', async () => {
        // an untrusted/user-selectable trade server returns `providers` as a truthy non-array
        // (typed as a non-optional array); a falsy-only guard let it through and the subsequent
        // `providers.forEach` threw "not a function", rejecting the thunk and leaving trading stuck
        // loading for the whole session. Array.isArray must route it to the safe default instead.
        const buyInfoAPI = {
            country: 'CZ',
            suggestedFiatCurrency: 'CZK',
            providers: {} as unknown as BuyProviderInfo[],
            defaultAmountsOfFiatCurrencies: {} as FiatCurrenciesProps,
        };

        tradeApi.getBuyList = () => Promise.resolve(buyInfoAPI);

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

    it('does not throw and drops poison (null/primitive) provider elements', async () => {
        // A malicious/mistyped trade-server response where the providers array contains a `null` or
        // primitive element must not crash the first `providerInfos[provider.name] = provider` deref
        // and reject the thunk (which would leave trading stuck loading for the whole session).
        const goodProvider: BuyProviderInfo = {
            name: 'GOOD',
            companyName: 'GOOD',
            tradedCoins: ['bitcoin'] as CryptoId[],
            tradedFiatCurrencies: ['USD'],
            logo: 'logo',
            isActive: true,
            paymentMethods: [] as BuyCryptoPaymentMethod[],
            supportedCountries: [],
            supportedSubdivisions: {},
        };

        const buyInfoAPI = {
            country: 'CZ',
            suggestedFiatCurrency: 'CZK',
            providers: [null, 42, 'evil', goodProvider] as unknown as BuyProviderInfo[],
            defaultAmountsOfFiatCurrencies: {} as FiatCurrenciesProps,
        };

        tradeApi.getBuyList = () => Promise.resolve(buyInfoAPI);

        const buyInfoData = await store.dispatch(buyThunks.loadInfoThunk()).unwrap();

        // only the valid provider survives, both in the map and in the stored providers array
        expect(buyInfoData.providerInfos).toEqual({ GOOD: goodProvider });
        expect(buyInfoData.buyInfo.providers).toEqual([goodProvider]);
        expect(buyInfoData.supportedFiatCurrencies).toEqual(['usd']);
        expect(buyInfoData.supportedCryptoCurrencies).toEqual(['bitcoin']);
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

        tradeApi.getBuyList = () => Promise.resolve(buyInfoAPI);

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

    it('does not throw on a poison provider missing tradedFiatCurrencies/tradedCoins (untrusted trade server)', async () => {
        // untrusted/user-selectable trade server returns a provider that omits the (typed as
        // non-optional) fields; without a guard `.map`/`.toLowerCase()`/spread throws and rejects
        // the thunk, leaving the trading feature stuck loading for the whole session.
        const poisonProvider = {
            name: 'POISON',
            companyName: 'POISON',
            logo: 'logo',
            isActive: true,
            paymentMethods: [] as BuyCryptoPaymentMethod[],
            supportedCountries: [],
            supportedSubdivisions: {},
        } as unknown as BuyProviderInfo;
        const goodProvider: BuyProviderInfo = {
            name: 'GOOD',
            companyName: 'GOOD',
            tradedCoins: ['bitcoin'] as CryptoId[],
            // a non-string element must not crash the per-element .toLowerCase()
            tradedFiatCurrencies: ['USD', 123 as unknown as string],
            logo: 'logo',
            isActive: true,
            paymentMethods: [] as BuyCryptoPaymentMethod[],
            supportedCountries: [],
            supportedSubdivisions: {},
        };

        const buyInfoAPI = {
            country: 'CZ',
            suggestedFiatCurrency: 'CZK',
            providers: [poisonProvider, goodProvider] as BuyProviderInfo[],
            defaultAmountsOfFiatCurrencies: {} as FiatCurrenciesProps,
        };

        tradeApi.getBuyList = () => Promise.resolve(buyInfoAPI);

        const buyInfoData = await store.dispatch(buyThunks.loadInfoThunk()).unwrap();

        // poison provider is skipped, the valid provider's valid entries survive
        expect(buyInfoData).toEqual(
            expect.objectContaining({
                supportedFiatCurrencies: ['usd'],
                supportedCryptoCurrencies: ['bitcoin'],
            }),
        );
    });
});
