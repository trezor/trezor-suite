import { buildWethDeposit } from './deposit';

describe('buildWethDeposit', () => {
    it('encodes the deposit selector with no args', () => {
        const result = buildWethDeposit({});

        expect(result.isValid).toBe(true);
        expect(result.data).toBe('0xd0e30db0');
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
    });
});
