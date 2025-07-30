import { FiatCurrencyCode } from 'invity-api';

import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { TradingCountryCode, regional, selectTradingSellInfo } from '@suite-common/trading';

import { supportedFiatCurrenciesMap } from '../consts/general/supportedFiatCurrencies';
import { TradingRootState, createMemoizedSelector } from '../reducers';
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
