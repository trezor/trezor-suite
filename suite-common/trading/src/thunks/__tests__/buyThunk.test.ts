import { combineReducers } from '@reduxjs/toolkit';
import { FiatCurrenciesProps } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { invityAPI } from '../../invityAPI';
import { buyInitialState } from '../../reducers/__fixtures__/buyTradingReducer';
import { prepareBuyReducer } from '../../reducers/buyReducer';
import { regional } from '../../regional';
import { buyThunks } from '../buyThunks';

const buyTradingReducer = prepareBuyReducer(extraDependenciesMock);

describe('Testing buy thunks', () => {
    jest.mock('../../invityAPI');

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

    it('testing loadInfoThunk - successful response', async () => {
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

    it('testing loadInfoThunk - unsuccessful response', async () => {
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
