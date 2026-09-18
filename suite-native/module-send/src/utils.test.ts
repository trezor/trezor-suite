import { getSendMaxAmount } from './utils';

describe(getSendMaxAmount.name, () => {
    test.each([
        {
            description: 'returns the token balance for a token send',
            input: {
                isTokenFlow: true,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            },
            expected: '42',
        },
        {
            description: 'returns the fee-adjusted amount for a native asset send',
            input: {
                isTokenFlow: false,
                tokenBalance: '42',
                normalFeeLevelMaxAmount: '0.5',
            },
            expected: '0.5',
        },
    ])('$description', ({ input, expected }) => {
        expect(getSendMaxAmount(input)).toBe(expected);
    });
});
