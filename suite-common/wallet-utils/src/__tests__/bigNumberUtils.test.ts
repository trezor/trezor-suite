import { BigNumber } from '@trezor/utils';

import { roundToNonZeroFractionDigits } from '../bigNumberUtils';

describe('BigNumber utils', () => {
    it('roundToNonZeroFractionDigits', () => {
        const cases = [
            {
                input: '0.000000012367',
                digits: 4,
                expected: '0.00000001237',
            },
            {
                input: '0.000123456',
                digits: 2,
                expected: '0.00012',
            },
            {
                input: '1.23456789',
                digits: 4,
                expected: '1.2346',
            },
            {
                input: '1.23400000',
                digits: 4,
                expected: '1.234',
            },
            {
                input: '1.00000000',
                digits: 4,
                expected: '1',
            },
        ];

        cases.forEach(c => {
            const result = roundToNonZeroFractionDigits(new BigNumber(c.input), c.digits);
            expect(result.toString()).toBe(c.expected);
        });
    });
});
