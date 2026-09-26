import { A, F } from '@mobily/ts-belt';

import {
    type CryptoBaseCurrencyPair,
    type RatesByKey,
    type TickerId,
} from '@suite-common/wallet-types';

type GetEarnDepositsFiatStatusParams = {
    missingStakingRateTickers: TickerId[];
    missingStablecoinYieldRateTickers: TickerId[];
    hasStakingFiatRate: boolean;
    hasStablecoinYieldFiatRate: boolean;
    isFiatRatesLoading: boolean;
};

export const getUniqueTickers = (tickers: TickerId[]): TickerId[] =>
    F.toMutable(
        A.uniqBy(tickers, ticker =>
            ticker.tokenAddress ? `${ticker.symbol}-${ticker.tokenAddress}` : ticker.symbol,
        ),
    );

export const getTokenFiatRate = (
    currentFiatRates: RatesByKey | undefined,
    fiatRateKey: CryptoBaseCurrencyPair,
): number | undefined => {
    if (!currentFiatRates) {
        return undefined;
    }

    const exactRate = currentFiatRates[fiatRateKey]?.rate;
    if (exactRate !== undefined) {
        return exactRate;
    }

    // Rates fetched for account tokens use the blockbook contract-address casing,
    // which may differ from the casing returned by the yield provider.
    const lowerCasedFiatRateKey = fiatRateKey.toLowerCase();
    const caseInsensitiveMatch = Object.entries(currentFiatRates).find(
        ([key]) => key.toLowerCase() === lowerCasedFiatRateKey,
    );

    return caseInsensitiveMatch?.[1]?.rate;
};

export const getEarnDepositsFiatStatus = ({
    missingStakingRateTickers,
    missingStablecoinYieldRateTickers,
    hasStakingFiatRate,
    hasStablecoinYieldFiatRate,
    isFiatRatesLoading,
}: GetEarnDepositsFiatStatusParams) => {
    const isStakingFiatRateMissing = missingStakingRateTickers.length > 0;
    const isStablecoinYieldFiatRateMissing = missingStablecoinYieldRateTickers.length > 0;
    const isFiatTotalIncomplete =
        (isStakingFiatRateMissing || isStablecoinYieldFiatRateMissing) && !isFiatRatesLoading;
    const isFiatTotalUnavailable =
        isFiatTotalIncomplete && !hasStakingFiatRate && !hasStablecoinYieldFiatRate;

    return {
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        isStakingFiatRateMissing,
        isStablecoinYieldFiatRateMissing,
    };
};
