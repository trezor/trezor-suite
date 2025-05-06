import { combineReducers } from '@reduxjs/toolkit';
import { ExchangeListResponse } from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';

import { exchangeThunks } from '../../';
import { invityAPI } from '../../../invityAPI';
import { exchange } from '../../../reducers/__fixtures__/exchangeTradingReducer';
import { exchangeInitialState, tradingExchangeReducer } from '../../../reducers/exchangeReducer';

describe('loadExchangeInfoThunk', () => {
    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const store = configureMockStore({
        extra: {},
        reducer: combineReducers({
            wallet: combineReducers({
                tradingNew: combineReducers({
                    exchange: tradingExchangeReducer,
                }),
            }),
        }),
        preloadedState: {
            wallet: {
                tradingNew: {
                    exchange: exchangeInitialState,
                },
            },
        },
    });

    it('should load data when response is successful', async () => {
        const exchangeInfoApi = [exchange];

        invityAPI.getExchangeList = () => Promise.resolve(exchangeInfoApi);

        const exchangeInfoData = await store.dispatch(exchangeThunks.loadInfoThunk()).unwrap();

        expect(exchangeInfoData).toEqual({
            providerInfos: {
                [exchange.name]: exchange,
            },
            buyCryptoIds: exchange.buyTickers,
            sellCryptoIds: exchange.sellTickers,
        });
    });

    it('should load data when response is successful with undefined tickers', async () => {
        const exchangeUpdated = {
            ...exchange,
            buyTickers: undefined,
            sellTickers: undefined,
        };
        const exchangeInfoApi = [exchangeUpdated];

        invityAPI.getExchangeList = () =>
            Promise.resolve(exchangeInfoApi as unknown as ExchangeListResponse);

        const exchangeInfoData = await store.dispatch(exchangeThunks.loadInfoThunk()).unwrap();

        expect(exchangeInfoData).toEqual({
            providerInfos: {
                [exchangeUpdated.name]: exchangeUpdated,
            },
            buyCryptoIds: [],
            sellCryptoIds: [],
        });
    });

    it('should load default data object when response is unsuccessful', async () => {
        invityAPI.getExchangeList = () =>
            Promise.resolve(undefined as unknown as ExchangeListResponse);

        const exchangeInfoData = await store.dispatch(exchangeThunks.loadInfoThunk()).unwrap();

        expect(exchangeInfoData).toEqual({
            providerInfos: {},
            buyCryptoIds: [],
            sellCryptoIds: [],
        });
    });
});
