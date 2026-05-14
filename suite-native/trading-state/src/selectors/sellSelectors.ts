import type { FiatCurrencyCode } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import {
    type TradingCountryCode,
    type TradingPaymentMethodProps,
    bestSellQuotePerPaymentMethodProjection,
    getCurrencyLabel,
    getDefaultCountrySubdivision,
    getTradingQuotesByPaymentMethod,
    nonSanctionedRegional,
    selectTradingSellInfo,
    selectValidTradingSellQuotes,
} from '@suite-common/trading';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type FiatCurrencyItem, type SellFormValues } from '@suite-native/trading-types';

import {
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
} from './residenceSelectors';
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
        selectTradingResidenceCountrySubdivision,
    ],
    (sellInfo, coins, residenceCountry, residenceCountrySubdivision) => {
        if (!sellInfo || !coins) {
            return {} as Partial<SellFormValues>;
        }

        const country = residenceCountry ?? (sellInfo.country as TradingCountryCode);

        const fiatCurrency = DEFAULT_FIAT_CURRENCY_FALLBACK;
        const countryDefaultValue =
            nonSanctionedRegional.getCountryOptionWithWorldwideFallback(country);

        const countrySubdivisionDefaultValue = getDefaultCountrySubdivision(
            residenceCountrySubdivision,
            countryDefaultValue.value,
        );

        return {
            fiatCurrency: fiatCurrency.toLowerCase(),
            country: countryDefaultValue,
            countrySubdivision: countrySubdivisionDefaultValue,
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
    bestSellQuotePerPaymentMethodProjection,
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
