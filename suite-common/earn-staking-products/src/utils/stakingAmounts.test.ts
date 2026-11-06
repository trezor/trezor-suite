import { BigNumber } from '@trezor/utils';

import {
    SMALLEST_STAKING_AMOUNT,
    ZERO_STAKING_AMOUNT,
    isPositiveStakingAmount,
    toStakingAmount,
} from './stakingAmounts';

describe('toStakingAmount', () => {
    it.each([
        { name: 'a decimal string', value: '1500000000', expected: '1500000000' },
        { name: 'a BigNumber', value: new BigNumber('2000000000'), expected: '2000000000' },
        { name: 'zero', value: '0', expected: '0' },
        { name: 'a fraction below one half', value: '854794.49', expected: '854794' },
        { name: 'a fraction of one half', value: '854794.5', expected: '854795' },
    ])('turns $name into base units', ({ value, expected }) => {
        expect(toStakingAmount(value)).toBe(expected);
    });

    it('rejects a negative value', () => {
        expect(() => toStakingAmount('-1')).toThrow();
    });
});

describe('ZERO_STAKING_AMOUNT', () => {
    it('is zero', () => {
        expect(ZERO_STAKING_AMOUNT).toBe('0');
    });
});

describe('SMALLEST_STAKING_AMOUNT', () => {
    it('is one base unit', () => {
        expect(SMALLEST_STAKING_AMOUNT).toBe('1');
    });
});

describe('isPositiveStakingAmount', () => {
    it.each([
        { amount: '0', expected: false },
        { amount: '1', expected: true },
        { amount: '1000000000000000000', expected: true },
    ])('reports $expected for $amount', ({ amount, expected }) => {
        expect(isPositiveStakingAmount(toStakingAmount(amount))).toBe(expected);
    });
});
