import { useFormatters } from '@suite-common/formatters';
import { type TradingTradeType } from '@suite-common/trading';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { useFormatCryptoValue } from '@suite-native/trading-atoms';
import { BigNumber } from '@trezor/utils';

import { type TradeOperationData, getTradeOperationData } from '../utils/utils';

export const useChangeStringsExtractor = (
    trade: TradingTradeType | undefined,
): TradeOperationData & {
    fromStringValue: string | undefined;
    toStringValue: string | undefined;
} => {
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
