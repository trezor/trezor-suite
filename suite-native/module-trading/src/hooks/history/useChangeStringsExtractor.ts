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
