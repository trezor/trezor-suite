import { combineReducers } from '@reduxjs/toolkit';
import { type ExchangeListResponse } from 'invity-api';

import { createTestStore } from '@suite-common/test-utils';

import { exchange } from '../../reducers/__fixtures__/exchangeTradingReducer';
import { exchangeInitialState, tradingExchangeReducer } from '../../reducers/exchangeReducer';
import { tradeApi } from '../../tradeApi';

import { exchangeThunks } from './index';

describe('loadExchangeInfoThunk', () => {
    jest.mock('../../tradeApi');

    tradeApi.setServersEnvironment = () => {};
    tradeApi.createApiKey = () => {};

    const store = createTestStore({
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

    it('does not throw and skips a provider with non-array (poison) tickers', async () => {
        // A malicious/mistyped trade-server response where a provider sends a truthy non-array
        // for buyTickers/sellTickers must not make the spread throw and reject the thunk (which
        // would leave the trading feature stuck loading for the whole session).
        const poisonProvider = {
            ...exchange,
            buyTickers: 123 as unknown as (typeof exchange)['buyTickers'],
            sellTickers: {} as unknown as (typeof exchange)['sellTickers'],
        };
        const exchangeInfoApi = [poisonProvider, exchange];

        tradeApi.getExchangeList = () =>
            Promise.resolve(exchangeInfoApi as unknown as ExchangeListResponse);

        const exchangeInfoData = await store.dispatch(exchangeThunks.loadInfoThunk()).unwrap();

        // the valid provider's tickers still load; the poison provider contributes nothing
        expect(exchangeInfoData.buyCryptoIds).toEqual(exchange.buyTickers);
        expect(exchangeInfoData.sellCryptoIds).toEqual(exchange.sellTickers);
    });

    it('does not throw and drops poison (null/primitive) provider elements', async () => {
        // A malicious/mistyped trade-server response where the provider array contains a `null` or
        // primitive element must not crash the first `providerInfos[exchange.name] = exchange` deref
        // and reject the thunk (which would leave trading stuck loading for the whole session).
        const exchangeInfoApi = [null, 42, 'evil', exchange];

        tradeApi.getExchangeList = () =>
            Promise.resolve(exchangeInfoApi as unknown as ExchangeListResponse);

        const exchangeInfoData = await store.dispatch(exchangeThunks.loadInfoThunk()).unwrap();

        // only the valid provider survives
        expect(exchangeInfoData.providerInfos).toEqual({ [exchange.name]: exchange });
        expect(exchangeInfoData.buyCryptoIds).toEqual(exchange.buyTickers);
        expect(exchangeInfoData.sellCryptoIds).toEqual(exchange.sellTickers);
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
