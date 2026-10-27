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

    it('rejects a fractional next reward timestamp', () => {
        const result = stakingProductInfoSchema.safeParse({
            ...mockStakingProductInfo(),
            nextRewardAt: 1.5,
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.path).toEqual(['nextRewardAt']);
    });
});
