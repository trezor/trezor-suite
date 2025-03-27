import { BuyProviderInfo, FiatCurrencyCode } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    regional,
    selectTradingBuyInfo,
    selectTradingBuySupportedCryptoIds,
} from '@suite-common/trading';

import { TradingRootState, createMemoizedSelector } from '../tradingSlice';
import { Country, FiatCurrencyItem, TradingBuyFormValues } from '../types';
import { supportedFiatCurrenciesMap } from '../utils/supportedFiatCurrencies';
import {
    coinInfoToTradeableAsset,
    tradeableAssetSortingComparator,
} from '../utils/tradeableAssetUtils';

const DEFAULT_FIAT_CURRENCY_FALLBACK = 'USD';

export const selectTradingBuy = (state: TradingRootState) => state.wallet.tradingNew.buy;

export const selectBuySelectedReceiveAccount = (state: TradingRootState) =>
    selectTradingBuy(state).selectedReceiveAccount;

export const selectBuySupportedFiatCurrencies = (state: TradingRootState) =>
    returnStableArrayIfEmpty(selectTradingBuy(state).buyInfo?.supportedFiatCurrencies);

export const selectBuyTradeableAssetsSorted = createMemoizedSelector(
    [
        selectTradingBuySupportedCryptoIds as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingBuySupportedCryptoIds>,
        ({ wallet }) => wallet.tradingNew.info.coins,
    ],
    (cryptoIds, coins) => {
        if (!coins || !cryptoIds) {
            return [];
        }

        return cryptoIds
            .map(cryptoId => coinInfoToTradeableAsset(cryptoId, coins[cryptoId]))
            .sort(tradeableAssetSortingComparator);
    },
);

export const selectBuyFormDefaultValues = createMemoizedSelector(
    [
        selectTradingBuyInfo as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingBuyInfo>,
        ({ wallet }) => wallet.tradingNew.info.coins,
    ],
    (buyInfo, coins) => {
        if (!buyInfo || !coins) {
            return {} as Partial<TradingBuyFormValues>;
        }

        const { country, suggestedFiatCurrency, providers } = buyInfo.buyInfo;

        const paymentMethod = {
            value: 'creditCard',
            label: 'Credit Card',
        };
        const fiatCurrency = suggestedFiatCurrency || DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue = regional.countriesMap.has(country)
            ? ({
                  value: country,
                  label: regional.countriesMap.get(country) as string,
              } as Country)
            : undefined;

        const suggestedProvider =
            providers.find(
                ({ supportedCountries, tradedFiatCurrencies }) =>
                    supportedCountries.includes(country) &&
                    tradedFiatCurrencies.includes(fiatCurrency),
            ) ?? ({} as BuyProviderInfo);

        return {
            fiatCurrency: fiatCurrency.toLowerCase(),
            paymentMethod,
            country: countryDefaultValue,
            provider: suggestedProvider.name,
        } as Partial<TradingBuyFormValues>;
    },
);

export const selectBuySupportedFiatCurrenciesList = createMemoizedSelector(
    [selectBuySupportedFiatCurrencies],
    currencies =>
        [...new Set(currencies).values()]
            .map(
                currency =>
                    supportedFiatCurrenciesMap.get(currency) ?? {
                        code: currency,
                        label: currency.toUpperCase(),
                    },
            )
            .map(
                ({ code, label }) =>
                    ({
                        value: code as FiatCurrencyCode,
                        displayValue: code.toUpperCase(),
                        label,
                    }) as FiatCurrencyItem,
            ),
);
