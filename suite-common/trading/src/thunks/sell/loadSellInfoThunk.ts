import { type CryptoId, type FiatCurrencyCode, type SellProviderInfo } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { unique } from '@trezor/utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { type SellInfo } from '../../reducers/sellReducer';
import { regional } from '../../regional';
import { tradeApi } from '../../tradeApi';
import { toTradingCountryCode } from '../../utils/countryUtils';

export const loadSellInfoThunk = createThunk<SellInfo, void, void>(
    `${TRADING_SELL_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const sellList = await tradeApi.getSellList();
        const providerInfos: { [name: string]: SellProviderInfo } = {};
        const supportedFiatCurrencies: FiatCurrencyCode[] = [];
        const supportedCryptoCurrencies: CryptoId[] = [];

        if (!Array.isArray(sellList?.providers)) {
            return fulfillWithValue({
                providerInfos,
                supportedFiatCurrencies,
                supportedCryptoCurrencies,
                country: regional.UNKNOWN_COUNTRY,
            });
        }

        sellList.providers.forEach(provider => (providerInfos[provider.name] = provider));

        sellList.providers.forEach(provider => {
            if (provider.tradedFiatCurrencies) {
                provider.tradedFiatCurrencies.forEach(currency =>
                    supportedFiatCurrencies.push(currency.toLowerCase() as FiatCurrencyCode),
                );
            }
            provider.tradedCoins.forEach(coin => supportedCryptoCurrencies.push(coin));
        });

        return fulfillWithValue({
            providerInfos,
            supportedFiatCurrencies: unique(supportedFiatCurrencies),
            supportedCryptoCurrencies: unique(supportedCryptoCurrencies),
            country: toTradingCountryCode(sellList.country),
            countrySubdivision: sellList.subdivision,
        });
    },
);
