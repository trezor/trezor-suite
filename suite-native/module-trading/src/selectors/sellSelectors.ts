import { FiatCurrencyCode, SellCryptoPaymentMethod, SellFiatTrade } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    TradingCountryCode,
    TradingPaymentMethodProps,
    getBestRatedQuote,
    getTradingQuotesByPaymentMethod,
    regional,
    selectTradingSellInfo,
    selectValidTradingSellQuotes,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';

import { supportedFiatCurrenciesMap } from '../consts/general/supportedFiatCurrencies';
import {
    TradingRootState,
    createMemoizedSelector,
    createMemoizedSelectorWithAccounts,
} from '../reducers';
import { FiatCurrencyItem } from '../types/general';
import { SellFormValues } from '../types/sell';

const DEFAULT_FIAT_CURRENCY_FALLBACK = 'USD';
export const selectTradingSell = (state: TradingRootState) => state.wallet.tradingNew.sell;

export const selectSellSupportedFiatCurrencies = (state: TradingRootState) =>
    returnStableArrayIfEmpty(
        selectTradingSell(state).sellInfo?.supportedFiatCurrencies as FiatCurrencyCode[],
    );

export const selectSellSupportedFiatCurrenciesList = createMemoizedSelector(
    [selectSellSupportedFiatCurrencies],
    (currencies): FiatCurrencyItem[] =>
        [...new Set(currencies)].map(code => ({
            value: code,
            displayValue: code.toUpperCase(),
            label: supportedFiatCurrenciesMap[code]?.label ?? code.toUpperCase(),
        })),
);

export const selectSellAmountLimits = (state: TradingRootState) =>
    selectTradingSell(state).amountLimits;

export const selectSellFormDefaultValues = createMemoizedSelector(
    [
        selectTradingSellInfo as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingSellInfo>,
        ({ wallet }) => wallet.tradingNew.info.coins,
    ],
    (sellInfo, coins) => {
        if (!sellInfo || !coins) {
            return {} as Partial<SellFormValues>;
        }

        const country = sellInfo.country as TradingCountryCode;

        const fiatCurrency = DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue = regional.countriesMap.has(country)
            ? {
                  value: country,
                  label: regional.countriesMap.get(country),
              }
            : undefined;

        return {
            fiatCurrency: fiatCurrency.toLowerCase(),
            country: countryDefaultValue,
            amountInCrypto: false,
        } as Partial<SellFormValues>;
    },
);

export const selectSellSelectedSendAccount = createMemoizedSelectorWithAccounts(
    [state => state, selectTradingSell],
    (state, { tradingAccountKey }) => selectAccountByKey(state, tradingAccountKey) || undefined,
);

export const selectSellBestQuotesForAvailablePaymentMethods = createMemoizedSelector(
    [selectValidTradingSellQuotes],
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
        }, new Map<SellCryptoPaymentMethod, SellFiatTrade[]>());

        return [...allQuotesByPaymentMethodMap.values()].map(quotesForPaymentMethod =>
            getBestRatedQuote(quotesForPaymentMethod, 'sell'),
        ) as SellFiatTrade[];
    },
);

export const selectSellQuotesByPaymentMethod = createMemoizedSelector(
    [
        selectValidTradingSellQuotes,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) => ({
        fixed: paymentMethod
            ? getTradingQuotesByPaymentMethod<'sell'>(quotes, paymentMethod)?.sort(
                  (a, b) => (b.rate ?? 0) - (a.rate ?? 0),
              )
            : [],
    }),
);
