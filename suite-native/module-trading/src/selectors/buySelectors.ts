import { BuyCryptoPaymentMethod, BuyTrade, FiatCurrencyCode } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    TradingPaymentMethodProps,
    getBestRatedQuote,
    getTradingQuotesByPaymentMethod,
    regional,
    selectTradingBuyInfo,
    selectTradingBuySupportedCryptoIds,
    selectValidTradingBuyQuotes,
} from '@suite-common/trading';

import { supportedFiatCurrenciesMap } from '../consts/general/supportedFiatCurrencies';
import { TradingRootState, createMemoizedSelector } from '../tradingSlice';
import { Country, FiatCurrencyItem, TradingBuyFormValues } from '../types';
import {
    coinInfoToTradeableAsset,
    tradeableAssetSortingComparator,
} from '../utils/general/tradeableAssetUtils';

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

        const { country, suggestedFiatCurrency } = buyInfo.buyInfo;

        const fiatCurrency = suggestedFiatCurrency || DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue = regional.countriesMap.has(country)
            ? ({
                  value: country,
                  label: regional.countriesMap.get(country) as string,
              } as Country)
            : undefined;

        return {
            fiatCurrency: fiatCurrency.toLowerCase(),
            country: countryDefaultValue,
            amountInCrypto: false,
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

export const selectBuyAmountLimits = (state: TradingRootState) =>
    selectTradingBuy(state).amountLimits;

export const selectValidTradingBuyQuotesNative = createMemoizedSelector(
    [
        selectValidTradingBuyQuotes as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectValidTradingBuyQuotes>,
    ],
    quotes => quotes.filter(quote => quote.exchange !== 'simplex'),
);

export const selectBuyBestQuotesForAvailablePaymentMethods = createMemoizedSelector(
    [selectValidTradingBuyQuotesNative],
    quotes => {
        const allQuotesByPaymentMethodMap = quotes.reduce((quotesByPaymentMethodMap, quote) => {
            const { paymentMethod, paymentMethodName } = quote;
            if (!paymentMethod || !paymentMethodName) {
                return quotesByPaymentMethodMap;
            }

            const existingQuotes = quotesByPaymentMethodMap.get(paymentMethod);
            if (!existingQuotes) {
                quotesByPaymentMethodMap.set(paymentMethod, [quote]);
            } else {
                existingQuotes.push(quote);
            }

            return quotesByPaymentMethodMap;
        }, new Map<BuyCryptoPaymentMethod, BuyTrade[]>());

        return [...allQuotesByPaymentMethodMap.values()].map(quotesForPaymentMethod =>
            getBestRatedQuote(quotesForPaymentMethod, 'buy'),
        ) as BuyTrade[];
    },
);

export const selectBuyQuotesByPaymentMethodNative = createMemoizedSelector(
    [
        selectValidTradingBuyQuotesNative,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) =>
        paymentMethod
            ? getTradingQuotesByPaymentMethod<'buy'>(quotes, paymentMethod)?.sort(
                  (a, b) => (a.rate ?? 0) - (b.rate ?? 0),
              )
            : undefined,
);
