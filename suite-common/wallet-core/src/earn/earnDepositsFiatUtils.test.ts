import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';

import { getEarnDepositsFiatStatus } from './earnDepositsFiatUtils';

const USDC_CONTRACT_LOWERCASE = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const ethSymbol = asNetworkSymbol('eth');

describe(getEarnDepositsFiatStatus.name, () => {
    it('reports a complete total when no rates are missing', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [],
            missingStablecoinYieldRateTickers: [],
            hasStakingFiatRate: true,
            hasStablecoinYieldFiatRate: true,
            isFiatRatesLoading: false,
        });

        expect(result).toEqual({
            isFiatTotalIncomplete: false,
            isFiatTotalUnavailable: false,
            isStakingFiatRateMissing: false,
            isStablecoinYieldFiatRateMissing: false,
        });
    });

    it('reports a lower-bound total when only one deposit type has a rate', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [{ symbol: ethSymbol }],
            missingStablecoinYieldRateTickers: [],
            hasStakingFiatRate: false,
            hasStablecoinYieldFiatRate: true,
            isFiatRatesLoading: false,
        });

        expect(result).toEqual({
            isFiatTotalIncomplete: true,
            isFiatTotalUnavailable: false,
            isStakingFiatRateMissing: true,
            isStablecoinYieldFiatRateMissing: false,
        });
    });

    it('reports an unavailable total when no deposit type has a rate', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [{ symbol: ethSymbol }],
            missingStablecoinYieldRateTickers: [
                { symbol: ethSymbol, tokenAddress: USDC_CONTRACT_LOWERCASE },
            ],
            hasStakingFiatRate: false,
            hasStablecoinYieldFiatRate: false,
            isFiatRatesLoading: false,
        });

        expect(result.isFiatTotalIncomplete).toBe(true);
        expect(result.isFiatTotalUnavailable).toBe(true);
    });

    it('does not report an incomplete total while missing rates are loading', () => {
        const result = getEarnDepositsFiatStatus({
            missingStakingRateTickers: [{ symbol: ethSymbol }],
            missingStablecoinYieldRateTickers: [],
            hasStakingFiatRate: false,
            hasStablecoinYieldFiatRate: false,
            isFiatRatesLoading: true,
        });

        expect(result.isFiatTotalIncomplete).toBe(false);
        expect(result.isFiatTotalUnavailable).toBe(false);
    });
});
