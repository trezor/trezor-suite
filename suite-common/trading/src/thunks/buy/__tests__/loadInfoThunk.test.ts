import { combineReducers } from '@reduxjs/toolkit';
import { FiatCurrenciesProps } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { buyThunks } from '../';
import { invityAPI } from '../../../invityAPI';
import { buyInitialState } from '../../../reducers/__fixtures__/buyTradingReducer';
import { prepareBuyReducer } from '../../../reducers/buyReducer';
import { regional } from '../../../regional';

const buyTradingReducer = prepareBuyReducer(extraDependenciesMock);

describe('Testing loadInfoThunk', () => {
    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const store = configureMockStore({
        extra: {},
        reducer: combineReducers({
            wallet: combineReducers({
                trading: combineReducers({
                    buy: buyTradingReducer,
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

    it('successful response', async () => {
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

    it('unsuccessful response', async () => {
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
});
