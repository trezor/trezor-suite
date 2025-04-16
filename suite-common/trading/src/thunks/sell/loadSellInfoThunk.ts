import { CryptoId, SellProviderInfo } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { invityAPI } from '../../invityAPI';
import { SellInfo } from '../../reducers/sellReducer';

export const loadSellInfoThunk = createThunk<SellInfo>(
    `${TRADING_SELL_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const sellList = await invityAPI.getSellList();
        const providerInfos: { [name: string]: SellProviderInfo } = {};
        const supportedFiatCurrencies: string[] = [];
        const supportedCryptoCurrencies: CryptoId[] = [];

        if (!Array.isArray(sellList?.providers)) {
            return fulfillWithValue({
                providerInfos,
                supportedFiatCurrencies,
                supportedCryptoCurrencies,
            });
        }

        sellList.providers.forEach(provider => (providerInfos[provider.name] = provider));

        sellList.providers.forEach(provider => {
            if (provider.tradedFiatCurrencies) {
                provider.tradedFiatCurrencies.forEach(currency =>
                    supportedFiatCurrencies.push(currency.toLowerCase()),
                );
            }
            provider.tradedCoins.forEach(coin => supportedCryptoCurrencies.push(coin));
        });

        return fulfillWithValue({
            providerInfos,
            supportedFiatCurrencies: [...new Set(supportedFiatCurrencies)],
            supportedCryptoCurrencies: [...new Set(supportedCryptoCurrencies)],
        });
    },
);
