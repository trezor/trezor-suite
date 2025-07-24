import { parseBalanceAmount } from '../utils';

describe(parseBalanceAmount.name, () => {
    it('parses balance amount correctly with valid input', () => {
        const result = parseBalanceAmount('$1,234.56');
        expect(result).toEqual({
            currencySymbol: '$',
            wholeNumber: '1,234',
            decimalNumber: '.56',
        });
    });

    it('parses balance amount correctly with valid input and no decimal part', () => {
        const result = parseBalanceAmount('€2,000');
        expect(result).toEqual({
            currencySymbol: '€',
            wholeNumber: '2,000',
            decimalNumber: '',
        });
    });

    it('parses balance amount correctly with valid input and only decimal part', () => {
        const result = parseBalanceAmount('CZK0.99');
        expect(result).toEqual({
            currencySymbol: 'CZK',
            wholeNumber: '0',
            decimalNumber: '.99',
        });
    });

    it('handles BTC correctly', () => {
        const result = parseBalanceAmount('BTC 0.01');
        expect(result).toEqual({
            currencySymbol: 'BTC',
            wholeNumber: '0',
            decimalNumber: '.01',
        });
    });

    it('handles sats correctly', () => {
        const result = parseBalanceAmount('1,477,571 sat');
        expect(result).toEqual({
            currencySymbol: 'sat',
            wholeNumber: '1,477,571',
            decimalNumber: '',
        });
    });

    it('handles invalid input with missing currency symbol', () => {
        const result = parseBalanceAmount('10,000.00');
        expect(result).toEqual({
            currencySymbol: null,
            wholeNumber: null,
            decimalNumber: '',
        });
    });
});
