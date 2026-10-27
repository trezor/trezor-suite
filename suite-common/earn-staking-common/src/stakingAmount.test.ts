import { stakingAmountSchema } from './stakingAmount';

describe('stakingAmountSchema', () => {
    it.each(['0', '1', '1000000000000000000'])('accepts the base-unit amount %s', amount => {
        expect(stakingAmountSchema.parse(amount)).toBe(amount);
    });

    it.each(['', '1.5', '-1', '0x10', ' 1', '1e18', '1,000'])('rejects %j', amount => {
        expect(stakingAmountSchema.safeParse(amount).success).toBe(false);
    });

    it('rejects numbers', () => {
        expect(stakingAmountSchema.safeParse(1).success).toBe(false);
    });
});
