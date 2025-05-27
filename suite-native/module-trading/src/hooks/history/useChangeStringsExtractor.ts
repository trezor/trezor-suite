import { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import { TradingTradeType, useTradingInfo } from '@suite-common/trading';
import { getNetwork, isNetworkSymbol } from '@suite-common/wallet-config';
import { localizeNumber } from '@suite-common/wallet-utils';
import {
    convertTokenValueToDecimal,
    formatNumberWithThousandCommas,
} from '@suite-native/formatters/src/utils';

import { TradeOperationData, getTradeOperationData } from '../../utils/general/utils';

export const useChangeStringsExtractor = (
    trade: TradingTradeType | undefined,
): TradeOperationData & {
    fromStringValue: string | undefined;
    toStringValue: string | undefined;
    formattedRate?: string | undefined;
} => {
    const { CryptoAmountFormatter, FiatAmountFormatter } = useFormatters();
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();

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
        const { coinSymbol } = cryptoIdToSymbolAndContractAddress(cryptoId);

        let formattedValue;
        if (coinSymbol && isNetworkSymbol(coinSymbol)) {
            const { decimals } = getNetwork(coinSymbol);

            formattedValue = CryptoAmountFormatter.format(value, {
                maxDisplayedDecimals: decimals,
                isBalance: true,
                symbol: coinSymbol,
                isEllipsisAppended: false,
                smallestUnitsOverride,
            });

            const splitValue = formattedValue.split(' ');
            if (splitValue.length > 1) {
                formattedValue = `${formatNumberWithThousandCommas(splitValue[0])} ${splitValue.slice(1).join(' ')}`;
            } else if (splitValue.length > 0) {
                formattedValue = formatNumberWithThousandCommas(splitValue[0]);
            }
        } else {
            const decimalValue = convertTokenValueToDecimal(value, 0);
            formattedValue = `${localizeNumber(decimalValue)} ${coinSymbol?.toLocaleUpperCase() || ''}`;
        }

        return formattedValue;
    };

    const formatFiatValue = (value: string | undefined, currency: string | undefined) => {
        if (value === undefined) {
            return undefined;
        }

        return (
            FiatAmountFormatter.format(value, {
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
            : formatFiatValue(rate.toString(), fromCurrency);

        const targetCurrencyFormatted = isToCrypto
            ? formatCryptoValue('1', toCurrency, false)
            : formatFiatValue('1', toCurrency);

        if (!rateFormatted || !targetCurrencyFormatted) {
            return undefined;
        }

        return `${rateFormatted} / ${targetCurrencyFormatted}`;
    };

    const fromStringValue = isFromCrypto
        ? formatCryptoValue(fromValue, fromCurrency)
        : formatFiatValue(fromValue, fromCurrency);

    const toStringValue = isToCrypto
        ? formatCryptoValue(toValue, toCurrency)
        : formatFiatValue(toValue, toCurrency);

    const formattedRate = formatExchangeRate();

    return {
        ...tradeOperationData,
        fromStringValue,
        toStringValue,
        formattedRate,
    };
};
