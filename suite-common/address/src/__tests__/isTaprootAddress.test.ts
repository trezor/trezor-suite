import { isTaprootAddress } from '../isTaprootAddress';

describe('isTaprootAddress', () => {
    it('returns false for empty string', () => {
        expect(isTaprootAddress('', 'btc')).toBe(false);
    });

    it('returns false for non-taproot addresses', () => {
        expect(isTaprootAddress('bc1zw508d6qejxtdg4y5r3zarvaryvg6kdaj', 'btc')).toBe(false);
        expect(
            isTaprootAddress(
                'bc1q6rgl33d3s9dugudw7n68yrryajkr3ha9q8q24j20zs62se4q9tsqdy0t2q',
                'btc',
            ),
        ).toBe(false);
    });

    it('returns true for taproot addresses', () => {
        expect(
            isTaprootAddress(
                'bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr',
                'btc',
            ),
        ).toBe(true);
        expect(
            isTaprootAddress(
                'tb1pn2d0yjeedavnkd8z8lhm566p0f2utm3lgvxrsdehnl94y34txmts5s7t4c',
                'test',
            ),
        ).toBe(true);
    });
});
