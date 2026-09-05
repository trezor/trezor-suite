import { type CryptoId, type ExchangeListResponse, type ExchangeProviderInfo } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { unique } from '@trezor/utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { type ExchangeInfo } from '../../reducers/exchangeReducer';
import { tradeApi } from '../../tradeApi';

export const getExchangeInfo = (exchangeList: ExchangeListResponse): ExchangeInfo => {
    const providerInfos: { [name: string]: ExchangeProviderInfo } = {};
    const buyCryptoIds: CryptoId[] = [];
    const sellCryptoIds: CryptoId[] = [];

    if (!Array.isArray(exchangeList)) {
        return { providerInfos, buyCryptoIds, sellCryptoIds };
    }

    exchangeList.forEach(exchange => (providerInfos[exchange.name] = exchange));

    exchangeList.forEach(provider => {
        if (provider.buyTickers) {
            buyCryptoIds.push(...provider.buyTickers);
        }

        if (provider.sellTickers) {
            sellCryptoIds.push(...provider.sellTickers);
        }
    });

    return {
        providerInfos,
        buyCryptoIds: unique(buyCryptoIds),
        sellCryptoIds: unique(sellCryptoIds),
    };
};

export const loadExchangeInfoThunk = createThunk<ExchangeInfo, void, void>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const exchangeList = await tradeApi.getExchangeList();

        return fulfillWithValue(getExchangeInfo(exchangeList));
    },
);
