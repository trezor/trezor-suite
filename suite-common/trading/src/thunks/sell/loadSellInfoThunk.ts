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

        // The `Array.isArray` guard above only rejects a non-array top-level value — it does NOT drop
        // poison *elements* (a `null`/primitive inside an otherwise-valid array). Reading `.name` on a
        // `null` element throws and rejects the whole thunk, leaving `isLoading` stuck `true` and
        // bricking trading for the session (see loadInitialDataThunk). Drop non-object elements first.
        const providers = sellList.providers.filter(
            (provider): provider is SellProviderInfo =>
                provider != null && typeof provider === 'object',
        );

        providers.forEach(provider => (providerInfos[provider.name] = provider));

        providers.forEach(provider => {
            // Guard against an untrusted trade-server response where a provider omits/mistypes these
            // fields: an unguarded `.forEach`/`.toLowerCase()` would throw and reject the thunk,
            // leaving the trading feature stuck in `isLoading` for the session (see loadInitialDataThunk).
            if (Array.isArray(provider.tradedFiatCurrencies)) {
                provider.tradedFiatCurrencies.forEach(currency => {
                    if (typeof currency === 'string') {
                        supportedFiatCurrencies.push(currency.toLowerCase() as FiatCurrencyCode);
                    }
                });
            }
            if (Array.isArray(provider.tradedCoins)) {
                provider.tradedCoins.forEach(coin => supportedCryptoCurrencies.push(coin));
            }
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
