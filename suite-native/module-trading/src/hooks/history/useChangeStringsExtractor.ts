import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { type TradingTradeType, useTradingUtils } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { type TradeOperationData, getTradeOperationData } from '../../utils/general/utils';

const TOKEN_DECIMALS_LENGTH = 16;

export const useChangeStringsExtractor = (
    trade: TradingTradeType | undefined,
): TradeOperationData & {
    fromStringValue: string | undefined;
    toStringValue: string | undefined;
    formattedRate?: string | undefined;
} => {
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const { cryptoIdToCoinSymbol } = useTradingUtils();

    const tradeOperationData = getTradeOperationData(trade);
    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        tradeOperationData;

    const formatCryptoValue = (
        value: string | undefined,
        cryptoId: CryptoId | undefined,
        smallestUnitsOverride?: boolean,
    ) => {
        if (value === undefined || cryptoId === undefined) {
            return undefined;
        }
        const coinSymbol = cryptoIdToCoinSymbol(cryptoId);
        const networkDecimals = coinSymbol ? getNetworkDecimals(coinSymbol) : undefined;

        return CryptoAmountFormatter.format(value, {
            maxDisplayedDecimals: networkDecimals ?? TOKEN_DECIMALS_LENGTH,
            isBalance: true,
            symbol: coinSymbol as NetworkSymbol,
            isEllipsisAppended: false,
            smallestUnitsOverride,
        });
    };

    const formatFiatValue = (
        value: BaseCurrencyAmount | undefined,
        currency: string | undefined,
    ) => {
        if (value === undefined) {
            return undefined;
        }

        return (
            BaseCurrencyAmountFormatter.format(value, {
                currency,
            }) ?? undefined
        );
    };

    const formatExchangeRate = () => {
        if (!fromValue || !toValue || !fromCurrency || !toCurrency) {
            return undefined;
        }

        const fromNumericValue = parseFloat(fromValue);
        const toNumericValue = parseFloat(toValue);

        if (isNaN(fromNumericValue) || isNaN(toNumericValue) || toNumericValue === 0) {
            return undefined;
        }

        const rate = fromNumericValue / toNumericValue;

        const rateFormatted = isFromCrypto
            ? formatCryptoValue(rate.toString(), fromCurrency, false)
            : formatFiatValue(asBaseCurrencyAmount(new BigNumber(rate)), fromCurrency);

        const targetCurrencyFormatted = isToCrypto
            ? formatCryptoValue('1', toCurrency, false)
            : formatFiatValue(asBaseCurrencyAmount(new BigNumber('1')), toCurrency);

        if (!rateFormatted || !targetCurrencyFormatted) {
            return undefined;
        }

        return `${rateFormatted} / ${targetCurrencyFormatted}`;
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
        formattedRate: formatExchangeRate(),
    };
};
