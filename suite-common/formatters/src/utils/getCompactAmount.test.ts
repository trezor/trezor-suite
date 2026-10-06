import { getCompactAmount } from './getCompactAmount';

const formatAmount = (value: string) =>
    getCompactAmount({
        value,
        maximumSignificantDigits: 4,
        minimumDisplayedValue: '0.0001',
    });

describe(getCompactAmount.name, () => {
    it.each([
        ['4.2000', { value: '4.2', isLessThanMinimum: false }],
        ['8.81234', { value: '8.812', isLessThanMinimum: false }],
        ['12345.67', { value: '12350', isLessThanMinimum: false }],
        ['0.0001', { value: '0.0001', isLessThanMinimum: false }],
        ['0.00009999', { value: '0.0001', isLessThanMinimum: true }],
        ['0', { value: '0', isLessThanMinimum: false }],
    ])('formats %s', (value, expected) => {
        expect(formatAmount(value)).toEqual(expected);
    });
});
