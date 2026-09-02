import { getYieldRateLabelType } from './getYieldRateLabelType';

type RewardRateFixtureParams = {
    rateType?: string;
    components?: { rate: number; rateType: string }[];
};

const createRewardRate = ({ rateType = 'APY', components = [] }: RewardRateFixtureParams) => ({
    rateType,
    components,
});

describe('getYieldRateLabelType', () => {
    it('returns apy when all components carry an APY rate', () => {
        const rewardRate = createRewardRate({
            components: [{ rate: 0.05, rateType: 'APY' }],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('apy');
    });

    it('returns apr when all components carry an APR rate', () => {
        const rewardRate = createRewardRate({
            components: [{ rate: 0.02, rateType: 'APR' }],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('apr');
    });

    it('returns rate when components mix APY and APR', () => {
        const rewardRate = createRewardRate({
            components: [
                { rate: 0.05, rateType: 'APY' },
                { rate: 0.02, rateType: 'APR' },
            ],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('rate');
    });

    it('ignores components without a positive rate', () => {
        const rewardRate = createRewardRate({
            components: [
                { rate: 0.05, rateType: 'APY' },
                { rate: 0, rateType: 'APR' },
            ],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('apy');
    });

    it('reads the rate type case-insensitively', () => {
        const rewardRate = createRewardRate({
            components: [{ rate: 0.05, rateType: 'apr' }],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('apr');
    });

    it('returns rate when a known rate type mixes with an unrecognized one', () => {
        const rewardRate = createRewardRate({
            components: [
                { rate: 0.04, rateType: 'APY' },
                { rate: 0.02, rateType: 'variable' },
            ],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('rate');
    });

    it('falls back to the aggregate rate type when no component has a usable rate', () => {
        const rewardRate = createRewardRate({ rateType: 'APR' });

        expect(getYieldRateLabelType(rewardRate)).toBe('apr');
    });

    it('returns rate when neither components nor the aggregate specify APY or APR', () => {
        const rewardRate = createRewardRate({
            rateType: 'variable',
            components: [{ rate: 0.05, rateType: 'variable' }],
        });

        expect(getYieldRateLabelType(rewardRate)).toBe('rate');
    });
});
