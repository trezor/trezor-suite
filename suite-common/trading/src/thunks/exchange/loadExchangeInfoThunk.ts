import { type CryptoId, type ExchangeProviderInfo } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { unique } from '@trezor/utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { type ExchangeInfo } from '../../reducers/exchangeReducer';
import { tradeApi } from '../../tradeApi';

export const loadExchangeInfoThunk = createThunk<ExchangeInfo, void, void>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const exchangeList = await tradeApi.getExchangeList();
        const providerInfos: { [name: string]: ExchangeProviderInfo } = {};
        const buyCryptoIds: CryptoId[] = [];
        const sellCryptoIds: CryptoId[] = [];

        if (!Array.isArray(exchangeList)) {
            return fulfillWithValue({ providerInfos, buyCryptoIds, sellCryptoIds });
        }

        exchangeList.forEach(exchange => (providerInfos[exchange.name] = exchange));

        // merge symbols supported by at least one partner
        exchangeList.forEach(provider => {
            // `buyTickers`/`sellTickers` are non-optional arrays in the invity-api types, but the
            // response comes from an untrusted/user-selectable trade server (exchange.trezor.io, or a
            // dev/staging/localhost env), so a provider mistyping either field to a truthy non-iterable
            // (e.g. a number or object) would make the spread throw "not iterable" and reject the whole
            // thunk — leaving `isLoading` stuck `true` and bricking trading for the rest of the session
            // (see loadInitialDataThunk). Guard with Array.isArray, matching the buy/sell siblings.
            if (Array.isArray(provider.buyTickers)) {
                buyCryptoIds.push(...provider.buyTickers);
            }

            if (Array.isArray(provider.sellTickers)) {
                sellCryptoIds.push(...provider.sellTickers);
            }
        });

        return fulfillWithValue({
            providerInfos,
            buyCryptoIds: unique(buyCryptoIds),
            sellCryptoIds: unique(sellCryptoIds),
        });
    },
);
