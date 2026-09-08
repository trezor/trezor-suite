import { getSendMaxAmount } from './utils';

describe(getSendMaxAmount.name, () => {
    it('returns the token balance for a token send', () => {
        expect(
            getSendMaxAmount({
                isTokenFlow: true,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            }),
        ).toBe('42');
    });

    it('returns the fee-adjusted amount for a native asset send', () => {
        expect(
            getSendMaxAmount({
                isTokenFlow: false,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            }),
        ).toBe('0.5');
    });
});
