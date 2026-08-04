import { type BuyProviderInfo, type CryptoId, type FiatCurrencyCode } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { TRADING_BUY_THUNK_PREFIX } from '../../constants';
import { type BuyInfo } from '../../reducers/buyReducer';
import { regional } from '../../regional';
import { tradeApi } from '../../tradeApi';
import { toTradingCountryCode } from '../../utils/countryUtils';

export const loadBuyInfoThunk = createThunk<BuyInfo, void, void>(
    `${TRADING_BUY_THUNK_PREFIX}/loadInfo`,
    async (_, { fulfillWithValue }) => {
        const buyInfo = await tradeApi.getBuyList();

        // `providers` is a non-optional array in the invity-api types, but the response comes from an
        // untrusted/user-selectable trade server (exchange.trezor.io, or a dev/staging/localhost env).
        // A falsy-only guard let a truthy non-array (e.g. an object or number) through, so the
        // `providers.forEach` below would throw "not a function" and reject the whole thunk — leaving
        // `isLoading` stuck `true` and bricking trading for the session (see loadInitialDataThunk).
        // Guard with Array.isArray, matching the sell/exchange siblings.
        if (!Array.isArray(buyInfo?.providers)) {
            return fulfillWithValue({
                buyInfo: {
                    country: regional.UNKNOWN_COUNTRY,
                    providers: [],
                    defaultAmountsOfFiatCurrencies: {} as Record<FiatCurrencyCode, number>,
                },
                providerInfos: {},
                supportedFiatCurrencies: [],
                supportedCryptoCurrencies: [],
            });
        }

        const providerInfos: { [name: string]: BuyProviderInfo } = {};

        // The `Array.isArray` guard above only rejects a non-array top-level value — it does NOT drop
        // poison *elements* (a `null`/primitive inside an otherwise-valid array). Reading `.name` on a
        // `null` element throws and rejects the whole thunk, leaving `isLoading` stuck `true` and
        // bricking trading for the session (see loadInitialDataThunk). Drop non-object elements first.
        const providers = buyInfo.providers.filter(
            (provider): provider is BuyProviderInfo =>
                provider != null && typeof provider === 'object',
        );

        providers.forEach(provider => (providerInfos[provider.name] = provider));

        const supportedFiatCurrencies: FiatCurrencyCode[] = [];
        const supportedCryptoCurrencies: CryptoId[] = [];
        providers.forEach(provider => {
            // `tradedFiatCurrencies`/`tradedCoins` are non-optional in the invity-api types, but the
            // response comes from an untrusted/user-selectable trade server (exchange.trezor.io, or a
            // dev/staging/localhost env), so a single provider missing/mistyping either field would
            // otherwise throw and reject the whole thunk — leaving `isLoading` stuck `true` and
            // bricking the trading feature for the rest of the session (see loadInitialDataThunk).
            if (Array.isArray(provider.tradedFiatCurrencies)) {
                provider.tradedFiatCurrencies.forEach(currency => {
                    if (typeof currency === 'string') {
                        supportedFiatCurrencies.push(currency.toLowerCase() as FiatCurrencyCode);
                    }
                });
            }
            if (Array.isArray(provider.tradedCoins)) {
                supportedCryptoCurrencies.push(...provider.tradedCoins);
            }
        });

        return fulfillWithValue({
            buyInfo: {
                ...buyInfo,
                providers,
                country: toTradingCountryCode(buyInfo.country),
            },
            providerInfos,
            supportedFiatCurrencies,
            supportedCryptoCurrencies,
        });
    },
);
