import type { CryptoId } from 'invity-api';

import { useFormatters } from '@suite-common/formatters';
import {
    type TradeOperationData,
    type TradingTradeType,
    formatExchangeRate,
    getTradeOperationData,
    useTradingUtils,
} from '@suite-common/trading';
import { type NetworkSymbol, getNetworkDecimals } from '@suite-common/wallet-config';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

const DEFAULT_TOKEN_DECIMALS_LENGTH = 18;

const useRateFormatters = () => {
    const { CryptoAmountFormatter, BaseCurrencyAmountFormatter } = useFormatters();
    const { cryptoIdToCoinSymbol } = useTradingUtils();

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

    return { cryptoIdToCoinSymbol, formatCryptoValue, formatFiatValue };
};

export const useTradingRateFromOperationData = (
    operationData: TradeOperationData | undefined,
): string | undefined => {
    const { cryptoIdToCoinSymbol, formatCryptoValue } = useRateFormatters();

    if (!operationData) return undefined;
    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        operationData;

    if (!fromValue || !toValue || !fromCurrency || !toCurrency) return undefined;

    const fromBigNumber = new BigNumber(fromValue);
    const toBigNumber = new BigNumber(toValue);

    if (fromBigNumber.isNaN() || toBigNumber.isNaN()) return undefined;

    // Buy/sell: always orient as <crypto> / 1 <fiat>. Exchange (crypto-to-crypto):
    // orient as <sendCoin> / 1 <receiveCoin> (keep the from/to direction).
    const isBuySell = isFromCrypto !== isToCrypto;
    const cryptoValue = isBuySell && !isFromCrypto ? toValue : fromValue;
    const cryptoCurrency = isBuySell && !isFromCrypto ? toCurrency : fromCurrency;
    const counterValue = isBuySell && !isFromCrypto ? fromValue : toValue;
    const counterCurrency = isBuySell && !isFromCrypto ? fromCurrency : toCurrency;
    const isCounterCrypto = isBuySell ? false : isToCrypto;

    const counterBigNumber = new BigNumber(counterValue);
    if (counterBigNumber.isZero()) return undefined;
    const rate = new BigNumber(cryptoValue).div(counterBigNumber);

    const cryptoSymbol = (
        cryptoIdToCoinSymbol(cryptoCurrency as CryptoId) ?? cryptoCurrency
    ).toUpperCase();
    const rateFormatted = `${formatExchangeRate(rate)} ${cryptoSymbol}`;

    const targetCurrencyFormatted = isCounterCrypto
        ? formatCryptoValue('1', counterCurrency as CryptoId, false)
        : `1 ${counterCurrency.toUpperCase()}`;

    if (!targetCurrencyFormatted) return undefined;

    return `${rateFormatted} / ${targetCurrencyFormatted}`;
};

export const useTradingOfferRate = (trade: TradingTradeType | undefined): string | undefined => {
    const { cryptoIdToCoinSymbol, formatCryptoValue, formatFiatValue } = useRateFormatters();

    const { fromValue, fromCurrency, toValue, toCurrency, isFromCrypto, isToCrypto } =
        getTradeOperationData(trade);

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
