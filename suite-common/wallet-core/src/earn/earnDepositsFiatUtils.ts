import { A, F } from '@mobily/ts-belt';

import {
    type BaseCurrencyAmount,
    type CryptoBaseCurrencyPair,
    type RatesByKey,
    type TickerId,
} from '@suite-common/wallet-types';
import { toFiatCurrency } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export type EarnFiatPosition = {
    tickerId: TickerId;
    fiatRateKey: CryptoBaseCurrencyPair;
    balance: string;
};

export type EarnFiatValuation = {
    tickerId: TickerId;
    fiatAmount: BaseCurrencyAmount | null;
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

export const getEarnPositionFiatAmount = (
    { balance, fiatRateKey }: EarnFiatPosition,
    currentFiatRates: RatesByKey | undefined,
): BaseCurrencyAmount | null =>
    toFiatCurrency({ amount: balance, rate: currentFiatRates?.[fiatRateKey]?.rate });

export const sumEarnFiatValuations = (valuations: readonly EarnFiatValuation[]): string =>
    valuations
        .reduce(
            (total, { fiatAmount }) => (fiatAmount === null ? total : total.plus(fiatAmount)),
            new BigNumber(0),
        )
        .toString();

export const getEarnMissingRateTickerIds = (valuations: readonly EarnFiatValuation[]): TickerId[] =>
    getUniqueTickers(
        valuations.filter(({ fiatAmount }) => fiatAmount === null).map(({ tickerId }) => tickerId),
    );

export const hasAnyEarnFiatRate = (valuations: readonly EarnFiatValuation[]): boolean =>
    valuations.some(({ fiatAmount }) => fiatAmount !== null);
