import { UINT256_MAX } from '@suite-common/suite-constants';
import { BigNumber } from '@trezor/utils';

import { isMaxAllowance, roundToNonZeroFractionDigits } from '../bigNumberUtils';

describe('BigNumber utils', () => {
    describe('isMaxAllowance', () => {
        const maxDecimal =
            '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        const formattedMaxDecimal =
            '115792089237316195423570985008687907853269984665640564039457.584007913129639935';

        it('returns true for uint256 max (hex constant and decimal string)', () => {
            expect(isMaxAllowance(UINT256_MAX)).toBe(true);
            expect(isMaxAllowance(maxDecimal)).toBe(true);
        });

        it('returns true for exact display-formatted uint256 max', () => {
            expect(isMaxAllowance(formattedMaxDecimal)).toBe(true);
        });

        it('returns false for non-max values', () => {
            expect(isMaxAllowance('0')).toBe(false);
            // this number is one order smaller than max
            expect(
                isMaxAllowance(
                    '15792089237316195423570985008687907853269984665640564039457584007913129639934',
                ),
            ).toBe(false);
        });

        it.each(['', 'abc', 'not-a-number', '12.34.56', '0xGG', ' '])(
            'returns false when value is not a valid number (%j)',
            invalid => {
                expect(isMaxAllowance(invalid)).toBe(false);
            },
        );
    });

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
