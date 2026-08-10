import { type RewardDtoV2, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';

export type YieldRateLabelType = 'apy' | 'apr' | 'rate';

type YieldRewardRateFields = {
    rateType: YieldDtoV2['rewardRate']['rateType'];
    components: Pick<RewardDtoV2, 'rate' | 'rateType'>[];
};

// The API declares the rate type as a plain string, so unexpected values must not
// produce a false APY/APR claim.
const normalizeRateKind = (rateType: string): 'apy' | 'apr' | null => {
    const rateKind = rateType.toLowerCase();

    if (rateKind === 'apy' || rateKind === 'apr') {
        return rateKind;
    }

    return null;
};

/**
 * Which label a vault's reward rate should carry: `apy`/`apr` only when every earning
 * component agrees on it, the neutral `rate` when they mix or are unrecognized.
 */
export const getYieldRateLabelType = (rewardRate: YieldRewardRateFields): YieldRateLabelType => {
    const rateKinds = new Set(
        rewardRate.components
            .filter(component => component.rate > 0)
            .map(component => normalizeRateKind(component.rateType)),
    );

    const hasApy = rateKinds.has('apy');
    const hasApr = rateKinds.has('apr');
    const hasUnrecognizedKind = rateKinds.has(null);

    if (hasApy && !hasApr && !hasUnrecognizedKind) {
        return 'apy';
    }

    if (hasApr && !hasApy && !hasUnrecognizedKind) {
        return 'apr';
    }

    if (hasApy || hasApr) {
        return 'rate';
    }

    // No component carries a recognizable rate — fall back to the aggregate field.
    return normalizeRateKind(rewardRate.rateType) ?? 'rate';
};
