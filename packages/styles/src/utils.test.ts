import { multiply, getValueAndUnit, sum, negative } from './utils';

describe('multiply', () => {
    it('handles various units', () => {
        expect(multiply(2, '10rem')).toBe('20rem');
        expect(multiply(3, '5vh')).toBe('15vh');
        expect(multiply(0.5, '100%')).toBe('50%');
    });

    it('handles decimals', () => {
        expect(multiply(2, '1.5rem')).toBe('3rem');
        expect(multiply(0.5, '.5rem')).toBe('0.25rem');
    });

    it('handles a missing unit', () => {
        expect(multiply(2, '5')).toBe('10');
    });
});

describe('getValueAndUnit', () => {
    it('handles various units', () => {
        expect(getValueAndUnit('10rem')).toEqual([10, 'rem']);
        expect(getValueAndUnit('5vh')).toEqual([5, 'vh']);
        expect(getValueAndUnit('100%')).toEqual([100, '%']);
    });

    it('handles decimals', () => {
        expect(getValueAndUnit('1.5rem')).toEqual([1.5, 'rem']);
        expect(getValueAndUnit('.5rem')).toEqual([0.5, 'rem']);
    });

    it('handles a missing unit', () => {
        expect(getValueAndUnit('5')[0]).toBe(5);
    });
});

describe('sum', () => {
    it('handles values with units', () => {
        expect(sum(['2rem', '3rem'])).toBe('5rem');
    });

    it('handles negative values with units', () => {
        expect(sum(['2rem', '-3rem'])).toBe('-1rem');
    });
});

describe('negative', () => {
    it('returns negative value of passed number', () => {
        expect(negative(5)).toBe(-5);
        expect(negative(0)).toBe(0);
        expect(negative(-5)).toBe(-5);
    });
});
