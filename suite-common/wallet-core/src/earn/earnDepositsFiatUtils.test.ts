import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Rate,
    type RatesByKey,
    type TickerId,
    asBaseCurrencyAmount,
    asCryptoBaseCurrencyCode,
    asTimestamp,
    toTokenAddress,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import {
    type EarnFiatPosition,
    type EarnFiatValuation,
    getEarnMissingRateTickerIds,
    getEarnPositionFiatAmount,
    hasAnyEarnFiatRate,
    sumEarnFiatValuations,
} from './earnDepositsFiatUtils';

const ethSymbol = asNetworkSymbol('eth');
const adaSymbol = asNetworkSymbol('ada');
const usdcContract = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

const adaFiatRateKey = asCryptoBaseCurrencyCode('ada-usd');
const usdcFiatRateKey = asCryptoBaseCurrencyCode(`eth-${usdcContract}-usd`);

const adaPosition: EarnFiatPosition = {
    tickerId: { symbol: adaSymbol },
    fiatRateKey: adaFiatRateKey,
    balance: '5',
};

const usdcPosition: EarnFiatPosition = {
    tickerId: { symbol: ethSymbol, tokenAddress: usdcContract },
    fiatRateKey: usdcFiatRateKey,
    balance: '100',
};

const createRate = (ticker: TickerId, rate: number | undefined): Rate => ({
    rate,
    lastTickerTimestamp: asTimestamp(0),
    lastSuccessfulFetchTimestamp: asTimestamp(0),
    isLoading: false,
    error: null,
    ticker,
});

const createRates = (entries: [EarnFiatPosition, number | undefined][]): RatesByKey =>
    entries.reduce<RatesByKey>((ratesByKey, [{ fiatRateKey, tickerId }, rate]) => {
        ratesByKey[fiatRateKey] = createRate(tickerId, rate);

        return ratesByKey;
    }, {});

const createValuation = (tickerId: TickerId, fiatAmount: string | null): EarnFiatValuation => ({
    tickerId,
    fiatAmount: fiatAmount === null ? null : asBaseCurrencyAmount(new BigNumber(fiatAmount)),
});

describe(getEarnPositionFiatAmount.name, () => {
    it('multiplies the balance by the rate found under the position rate key', () => {
        const fiatAmount = getEarnPositionFiatAmount(
            adaPosition,
            createRates([[adaPosition, 0.5]]),
        );

        expect(fiatAmount?.toFixed()).toBe('2.5');
    });

    it('returns null when the rate is missing or rates are not loaded', () => {
        expect(getEarnPositionFiatAmount(adaPosition, createRates([]))).toBeNull();
        expect(
            getEarnPositionFiatAmount(adaPosition, createRates([[adaPosition, undefined]])),
        ).toBeNull();
        expect(getEarnPositionFiatAmount(adaPosition, undefined)).toBeNull();
    });

    it('looks up token positions by their token rate key', () => {
        const fiatAmount = getEarnPositionFiatAmount(
            usdcPosition,
            createRates([
                [adaPosition, 0.5],
                [usdcPosition, 1],
            ]),
        );

        expect(fiatAmount?.toFixed()).toBe('100');
    });
});

describe(sumEarnFiatValuations.name, () => {
    it('sums valued positions and skips positions without a fiat amount', () => {
        const total = sumEarnFiatValuations([
            createValuation(adaPosition.tickerId, '2.5'),
            createValuation(usdcPosition.tickerId, null),
            createValuation(usdcPosition.tickerId, '100'),
        ]);

        expect(total).toBe('102.5');
    });

    it('returns zero for no valuations', () => {
        expect(sumEarnFiatValuations([])).toBe('0');
    });
});

describe(getEarnMissingRateTickerIds.name, () => {
    it('lists each ticker without a fiat amount once', () => {
        const missingTickerIds = getEarnMissingRateTickerIds([
            createValuation(adaPosition.tickerId, '2.5'),
            createValuation(usdcPosition.tickerId, null),
            createValuation({ symbol: ethSymbol, tokenAddress: usdcContract }, null),
            createValuation({ symbol: adaSymbol }, null),
        ]);

        expect(missingTickerIds).toEqual([usdcPosition.tickerId, { symbol: adaSymbol }]);
    });

    it('returns an empty list when every position is valued', () => {
        expect(getEarnMissingRateTickerIds([createValuation(adaPosition.tickerId, '1')])).toEqual(
            [],
        );
    });
});

describe(hasAnyEarnFiatRate.name, () => {
    it('is true when at least one position has a fiat amount', () => {
        expect(
            hasAnyEarnFiatRate([
                createValuation(adaPosition.tickerId, null),
                createValuation(usdcPosition.tickerId, '0'),
            ]),
        ).toBe(true);
    });

    it('is false when no position has a fiat amount', () => {
        expect(hasAnyEarnFiatRate([createValuation(adaPosition.tickerId, null)])).toBe(false);
        expect(hasAnyEarnFiatRate([])).toBe(false);
    });
});
