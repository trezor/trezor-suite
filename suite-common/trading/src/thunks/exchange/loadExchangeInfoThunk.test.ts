import { combineReducers } from '@reduxjs/toolkit';
import { type ExchangeListResponse } from 'invity-api';

import { configureMockStore } from '@suite-common/test-utils';

import { exchange } from '../../reducers/__fixtures__/exchangeTradingReducer';
import { exchangeInitialState, tradingExchangeReducer } from '../../reducers/exchangeReducer';
import { tradeApi } from '../../tradeApi';

import { exchangeThunks } from './index';

describe('loadExchangeInfoThunk', () => {
    jest.mock('../../tradeApi');

    tradeApi.setServersEnvironment = () => {};
    tradeApi.createApiKey = () => {};

    const store = configureMockStore({
        extra: undefined,
        reducer: combineReducers({
            wallet: combineReducers({
                trading: combineReducers({
                    exchange: tradingExchangeReducer,
                }),
            }),
        }),
        preloadedState: {
            wallet: {
                trading: {
                    exchange: exchangeInitialState,
                },
            },
        },
    });

    it('should load data when response is successful', async () => {
        const exchangeInfoApi = [exchange];

        tradeApi.getExchangeList = () => Promise.resolve(exchangeInfoApi);

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

        tradeApi.getExchangeList = () =>
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
        tradeApi.getExchangeList = () =>
            Promise.resolve(undefined as unknown as ExchangeListResponse);

        const exchangeInfoData = await store.dispatch(exchangeThunks.loadInfoThunk()).unwrap();

        expect(exchangeInfoData).toEqual({
            providerInfos: {},
            buyCryptoIds: [],
            sellCryptoIds: [],
        });
    });
});
