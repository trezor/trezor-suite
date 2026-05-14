import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import {
    type TradingTradeType,
    formatExchangeRate,
    getTradeOperationData,
    useTradingUtils,
} from '@suite-common/trading';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

const DEFAULT_TOKEN_DECIMALS_LENGTH = 18;

export const useTradingOfferRate = (trade: TradingTradeType | undefined): string | undefined => {
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const { cryptoIdToCoinSymbol } = useTradingUtils();

    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        getTradeOperationData(trade);

    const formatCryptoValue = (
        value: string | undefined,
        cryptoId: CryptoId | undefined,
        smallestUnitsOverride?: boolean,
    ) => {
        if (value === undefined || cryptoId === undefined) return undefined;
        const coinSymbol = cryptoIdToCoinSymbol(cryptoId);
        const networkDecimals = coinSymbol ? getNetworkDecimals(coinSymbol) : undefined;

        return CryptoAmountFormatter.format(value, {
            maxDisplayedDecimals: networkDecimals ?? DEFAULT_TOKEN_DECIMALS_LENGTH,
            isBalance: true,
            symbol: coinSymbol as NetworkSymbol,
            isEllipsisAppended: false,
            smallestUnitsOverride,
        });
    };

    const formatFiatValue = (
        value: BaseCurrencyAmount | undefined,
        currency: string | undefined,
        fractionDigits?: number,
    ) => {
        if (value === undefined) return undefined;

        return (
            BaseCurrencyAmountFormatter.format(value, {
                currency,
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            }) ?? undefined
        );
    };

    if (!fromValue || !toValue || !fromCurrency || !toCurrency) return undefined;

    const fromBigNumber = new BigNumber(fromValue);
    const toBigNumber = new BigNumber(toValue);

    if (fromBigNumber.isNaN() || toBigNumber.isNaN() || toBigNumber.isZero()) return undefined;

    const rate = fromBigNumber.div(toBigNumber);

    const fromSymbol = isFromCrypto
        ? (cryptoIdToCoinSymbol(fromCurrency as CryptoId) ?? fromCurrency).toUpperCase()
        : fromCurrency;
    const rateFormatted = `${formatExchangeRate(rate)} ${fromSymbol}`;

    const targetCurrencyFormatted = isToCrypto
        ? formatCryptoValue('1', toCurrency, false)
        : formatFiatValue(asBaseCurrencyAmount(new BigNumber('1')), toCurrency, 0);

    if (!targetCurrencyFormatted) return undefined;

    return `${rateFormatted} / ${targetCurrencyFormatted}`;
};
