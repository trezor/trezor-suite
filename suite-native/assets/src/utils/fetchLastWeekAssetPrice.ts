import { getUnixTime, subWeeks } from 'date-fns';

import { getFiatRatesForTimestamps } from '@suite-common/fiat-services';
import { type BackendType, type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type WalletSettings } from '@suite-common/wallet-types';

type FetchLastWeekAssetPriceParams = {
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    fiatCurrencyCode: WalletSettings['localCurrency'];
    backendType?: BackendType;
};

export const fetchLastWeekAssetPrice = async ({
    networkSymbol,
    tokenContract,
    fiatCurrencyCode,
    backendType,
}: FetchLastWeekAssetPriceParams) => {
    const weekAgoTimestamp = getUnixTime(subWeeks(new Date(), 1));
    const historicalRates = await getFiatRatesForTimestamps(
        { symbol: networkSymbol, tokenAddress: tokenContract },
        [weekAgoTimestamp],
        fiatCurrencyCode,
        backendType === 'electrum',
        tokenContract !== undefined && networkSymbol !== 'eth',
    );

    // Providers may normalize the requested timestamp. Since only one timestamp was requested,
    // its rate is the first and only response rather than an exact timestamp match.
    return historicalRates?.tickers[0]?.rates[fiatCurrencyCode];
};
