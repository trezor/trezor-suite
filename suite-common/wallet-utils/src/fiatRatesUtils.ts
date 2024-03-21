import { NetworkSymbol } from '@suite-common/wallet-config';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { TokenAddress, FiatRateKey, TickerId, Timestamp } from '@suite-common/wallet-types';

export const getFiatRateKey = (
    symbol: NetworkSymbol,
    fiatCurrency: FiatCurrencyCode,
    tokenAddress?: TokenAddress,
): FiatRateKey => {
    if (tokenAddress) {
        return `${symbol}-${tokenAddress}-${fiatCurrency}` as FiatRateKey;
    }

    return `${symbol}-${fiatCurrency}` as FiatRateKey;
};

export const getFiatRateKeyFromTicker = (
    ticker: TickerId,
    fiatCurrency: FiatCurrencyCode,
): FiatRateKey => {
    const { symbol, tokenAddress } = ticker;

    return getFiatRateKey(symbol, fiatCurrency, tokenAddress);
};

export const roundTimestampToNearestPastHour = (timestamp: Timestamp) => {
    const date = new Date(timestamp * 1000);
    date.setMinutes(0, 0, 0);
    const roundedTimestamp = Math.floor(date.getTime() / 1000);

    if (roundedTimestamp > timestamp) {
        return roundedTimestamp - 3600;
    }

    return roundedTimestamp;
};

export const roundTimestampsToNearestPastHour = (timestamps: Timestamp[]) => {
    return timestamps.map(timestamp => {
        return roundTimestampToNearestPastHour(timestamp);
    });
};
