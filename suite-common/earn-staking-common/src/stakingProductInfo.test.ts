import { type StakingProductTarget, stakingProductInfoSchema } from './stakingProductInfo';
import { stakingProviderIdSchema } from './stakingProvider';
import { mockStakingProductInfo } from '../mocks';

const target: StakingProductTarget = {
    address: 'pool1xflehvzad4wr6rrvf6eea65jst5af0r4k0rh4xvmnqgvkzt3xjt',
    providerId: stakingProviderIdSchema.parse('everstake'),
    name: 'Everstake',
    rate: 2.06,
    saturation: 62.64,
};

describe('stakingProductInfoSchema', () => {
    it('parses product info unchanged', () => {
        const info = mockStakingProductInfo();

        expect(stakingProductInfoSchema.parse(info)).toEqual(info);
    });

    it('accepts unknown rates and periods as null', () => {
        const info = mockStakingProductInfo({
            rate: null,
            entryPeriodDays: null,
            exitPeriodDays: null,
            nextRewardAt: null,
            targets: [],
        });

        expect(stakingProductInfoSchema.parse(info)).toEqual(info);
    });

    it('accepts a zero rate', () => {
        const info = mockStakingProductInfo({ rate: 0 });

        expect(stakingProductInfoSchema.parse(info)).toEqual(info);
    });

    it('rejects a negative rate', () => {
        const result = stakingProductInfoSchema.safeParse(mockStakingProductInfo({ rate: -0.5 }));

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['rate']);
    });

    it('rejects a negative target rate', () => {
        const result = stakingProductInfoSchema.safeParse(
            mockStakingProductInfo({ targets: [{ ...target, rate: -0.5 }] }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['targets', 0, 'rate']);
    });

    it('rejects an unknown key', () => {
        const result = stakingProductInfoSchema.safeParse({
            ...mockStakingProductInfo(),
            tvl: '1',
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.code).toBe('unrecognized_keys');
    });

    it('rejects a fractional next reward timestamp', () => {
        const result = stakingProductInfoSchema.safeParse({
            ...mockStakingProductInfo(),
            nextRewardAt: 1.5,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['nextRewardAt']);
    });

    it('accepts a target without a known saturation', () => {
        const info = mockStakingProductInfo({ targets: [{ ...target, saturation: null }] });

        expect(stakingProductInfoSchema.parse(info)).toEqual(info);
    });

    it('accepts an oversaturated target', () => {
        const info = mockStakingProductInfo({ targets: [{ ...target, saturation: 104.2 }] });

        expect(stakingProductInfoSchema.parse(info)).toEqual(info);
    });

    it('requires every target to state its saturation', () => {
        const { saturation: _saturation, ...targetWithoutSaturation } = target;
        const result = stakingProductInfoSchema.safeParse({
            ...mockStakingProductInfo(),
            targets: [targetWithoutSaturation],
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['targets', 0, 'saturation']);
    });

    it('rejects two targets with the same address', () => {
        const result = stakingProductInfoSchema.safeParse(
            mockStakingProductInfo({ targets: [target, { ...target, rate: 3.1 }] }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['targets']);
    });

    it('rejects a negative saturation', () => {
        const result = stakingProductInfoSchema.safeParse(
            mockStakingProductInfo({ targets: [{ ...target, saturation: -1 }] }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['targets', 0, 'saturation']);
    });
});
