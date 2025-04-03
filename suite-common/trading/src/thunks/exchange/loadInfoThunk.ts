import { CryptoId, ExchangeProviderInfo } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { ExchangeInfo } from '../../reducers/exchangeReducer';

export const loadInfoThunk = createThunk<ExchangeInfo>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const exchangeList = await invityAPI.getExchangeList();
        const providerInfos: { [name: string]: ExchangeProviderInfo } = {};
        const buyCryptoIds: CryptoId[] = [];
        const sellCryptoIds: CryptoId[] = [];

        if (!exchangeList || exchangeList.length === 0) {
            return fulfillWithValue({ providerInfos, buyCryptoIds, sellCryptoIds });
        }

        exchangeList.forEach(exchange => (providerInfos[exchange.name] = exchange));

        // merge symbols supported by at least one partner
        exchangeList.forEach(provider => {
            if (provider.buyTickers) {
                buyCryptoIds.push(...provider.buyTickers);
            }

            if (provider.sellTickers) {
                sellCryptoIds.push(...provider.sellTickers);
            }
        });

        return fulfillWithValue({
            providerInfos,
            buyCryptoIds: [...new Set(buyCryptoIds)],
            sellCryptoIds: [...new Set(sellCryptoIds)],
        });
    },
);
