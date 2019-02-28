import * as utils from '../formatUtils';

describe('format utils', () => {
    it('to decimal amount', () => {
        expect(utils.toDecimalAmount(0, 1)).toBe('0');
        expect(utils.toDecimalAmount(1, 1)).toBe('0.1');
        expect(utils.toDecimalAmount(1000, 1)).toBe('100');
        expect(utils.toDecimalAmount(1000, 2)).toBe('10');
        expect(utils.toDecimalAmount(1000, 3)).toBe('1');
        expect(utils.toDecimalAmount('1', 'a')).toBe('NaN');
        expect(utils.toDecimalAmount('a', 'a')).toBe('0');
        expect(utils.toDecimalAmount('a', '1')).toBe('0');
    });

    it('from decimal amount', () => {
        expect(utils.fromDecimalAmount(0, 1)).toBe('0');
        expect(utils.fromDecimalAmount(10, 1)).toBe('100');
        expect(utils.fromDecimalAmount(10, 2)).toBe('1000');
        expect(utils.fromDecimalAmount(10, 3)).toBe('10000');
        expect(utils.fromDecimalAmount('1', 'a')).toBe('NaN');
        expect(utils.fromDecimalAmount('a', 'a')).toBe('0');
        expect(utils.fromDecimalAmount('a', '1')).toBe('0');
    });
});
