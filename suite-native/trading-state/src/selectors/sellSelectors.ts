import type { FiatCurrencyCode, SellCryptoPaymentMethod, SellFiatTrade } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { invariant } from '@suite-common/suite-utils';
import {
    type TradingCountryCode,
    type TradingPaymentMethodProps,
    getCurrencyLabel,
    getTradingQuotesByPaymentMethod,
    nonSanctionedRegional,
    selectTradingSellInfo,
    selectValidTradingSellQuotes,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type FiatCurrencyItem, type SellFormValues } from '@suite-native/trading-types';

import { selectTradingResidenceCountry } from './residenceSelectors';
import {
    type TradingRootState,
    createMemoizedSelector,
    createMemoizedSelectorWithAccounts,
} from '../reducers';

const DEFAULT_FIAT_CURRENCY_FALLBACK = 'USD';
export const selectTradingSell = (state: TradingRootState) => state.wallet.trading.sell;

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
            label: getCurrencyLabel(code),
        })),
);

export const selectSellAmountLimits = (state: TradingRootState) =>
    selectTradingSell(state).amountLimits;

export const selectSellFormDefaultValues = createMemoizedSelector(
    [
        selectTradingSellInfo as unknown as (
            state: TradingRootState,
        ) => ReturnType<typeof selectTradingSellInfo>,
        ({ wallet }) => wallet.trading.info.coins,
        selectTradingResidenceCountry,
    ],
    (sellInfo, coins, residenceCountry) => {
        if (!sellInfo || !coins) {
            return {} as Partial<SellFormValues>;
        }

        const country = residenceCountry ?? (sellInfo.country as TradingCountryCode);

        const fiatCurrency = DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue =
            nonSanctionedRegional.getCountryOptionWithWorldwideFallback(country);

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
        const bestQuoteByPaymentMethodMap = quotes.reduce((quotesByPaymentMethodMap, quote) => {
            const { paymentMethod, paymentMethodName } = quote;
            const isValidPaymentMethod = paymentMethod && paymentMethodName;

            // we only want one quote per payment method (and the 1st is considered the best)
            if (isValidPaymentMethod && !quotesByPaymentMethodMap.has(paymentMethod)) {
                quotesByPaymentMethodMap.set(paymentMethod, quote);
            }

            return quotesByPaymentMethodMap;
        }, new Map<SellCryptoPaymentMethod, SellFiatTrade>());

        return [...bestQuoteByPaymentMethodMap.values()].sort(
            ({ rate: aRate }, { rate: bRate }) => {
                // note that quotes without a valid rate should be filtered out by selectValidTradingSellQuotes
                invariant(aRate, 'rate in object "a" is required for sorting');
                invariant(bRate, 'rate in object "b" is required for sorting');

                return bRate - aRate;
            },
        );
    },
);

export const selectSellQuotesByPaymentMethod = createMemoizedSelector(
    [
        selectValidTradingSellQuotes,
        (_: TradingRootState, paymentMethod: TradingPaymentMethodProps | undefined) =>
            paymentMethod,
    ],
    (quotes, paymentMethod) => ({
        fixed: paymentMethod ? getTradingQuotesByPaymentMethod<'sell'>(quotes, paymentMethod) : [],
    }),
);
