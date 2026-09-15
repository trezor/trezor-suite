import { useFormatters } from '@suite-common/formatters';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { useFormatCryptoValue } from './useFormatCryptoValue';
import type { TradingTradeType } from '../types';
import { type TradeOperationData, getTradeOperationData } from '../utils/tradeOperationUtils';

export const useChangeStringsExtractor = (
    trade: TradingTradeType | undefined,
): TradeOperationData & {
    fromStringValue: string | undefined;
    toStringValue: string | undefined;
} => {
    // React Compiler: `formatCryptoValue` and `BaseCurrencyAmountFormatter` keep one identity for
    // this hook's whole life -- the first through a `useCallback` chain that bottoms out at
    // `useFreshRef` in `useCoinsAndPlatforms`, the second through the `FormatterProvider` context
    // value. Compiling this would cache the formatted strings on those two plus `trade`, so they
    // would freeze on the first render even though they depend on the invity catalog that
    // `useCoinsAndPlatforms` reads out of redux through that ref. Remove once the catalog is read
    // as a value instead of through a ref.
    'use no memo';

    const { BaseCurrencyAmountFormatter } = useFormatters();
    const formatCryptoValue = useFormatCryptoValue();

    const tradeOperationData = getTradeOperationData(trade);
    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        tradeOperationData;

    const formatFiatValue = (
        value: BaseCurrencyAmount | undefined,
        currency: string | undefined,
        fractionDigits?: number,
    ) => {
        if (value === undefined) {
            return undefined;
        }

        return (
            BaseCurrencyAmountFormatter.format(value, {
                currency,
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            }) ?? undefined
        );
    };

    const fromStringValue = isFromCrypto
        ? formatCryptoValue(fromValue, fromCurrency)
        : formatFiatValue(
              fromValue !== undefined ? asBaseCurrencyAmount(new BigNumber(fromValue)) : undefined,
              fromCurrency,
          );

    const toStringValue = isToCrypto
        ? formatCryptoValue(toValue, toCurrency)
        : formatFiatValue(
              toValue !== undefined ? asBaseCurrencyAmount(new BigNumber(toValue)) : undefined,
              toCurrency,
          );

    return {
        ...tradeOperationData,
        fromStringValue,
        toStringValue,
    };
};
