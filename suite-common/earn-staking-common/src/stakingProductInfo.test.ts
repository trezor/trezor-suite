import { stakingProductInfoSchema } from './stakingProductInfo';
import { mockStakingProductInfo } from '../mocks';

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
        const [target] = mockStakingProductInfo().targets;
        const result = stakingProductInfoSchema.safeParse(
            mockStakingProductInfo({ targets: target ? [{ ...target, rate: -0.5 }] : [] }),
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
});
