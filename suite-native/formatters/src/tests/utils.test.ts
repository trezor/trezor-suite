import { parseBalanceAmount } from '../utils';

describe('parseBalanceAmount', () => {
    test('should parse balance amount correctly with valid input', () => {
        const result = parseBalanceAmount('$1,234.56');
        expect(result).toEqual({
            currencySymbol: '$',
            wholeNumber: '1,234',
            decimalNumber: '.56',
        });
    });

    test('should parse balance amount correctly with valid input and no decimal part', () => {
        const result = parseBalanceAmount('€2,000');
        expect(result).toEqual({
            currencySymbol: '€',
            wholeNumber: '2,000',
            decimalNumber: '',
        });
    });

    test('should parse balance amount correctly with valid input and only decimal part', () => {
        const result = parseBalanceAmount('CZK0.99');
        expect(result).toEqual({
            currencySymbol: 'CZK',
            wholeNumber: '0',
            decimalNumber: '.99',
        });
    });

    test('should handle invalid input with missing currency symbol', () => {
        const result = parseBalanceAmount('10,000.00');
        expect(result).toEqual({
            currencySymbol: null,
            wholeNumber: null,
            decimalNumber: '',
        });
    });
});
