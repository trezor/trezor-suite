import { getLocaleSeparators } from '@trezor/utils';

import {
    type AmountLimits,
    formatRawAmount,
    getDisplayMaxLength,
    getEditedRawAmount,
    parsePastedAmount,
} from './localizedAmountInputUtils';

describe('formatRawAmount', () => {
    it.each([
        ['en-US', '', ''],
        ['en-US', '1234.5', '1,234.5'],
        ['en-US', '1.', '1.'],
        ['en-US', '1.50', '1.50'],
        ['de-DE', '1234567.89', '1.234.567,89'],
        ['es-ES', '1234', '1234'],
        ['es-ES', '12345', '12.345'],
    ])('should format %s raw amount %s as %s', (locale, rawAmount, expected) => {
        expect(formatRawAmount(rawAmount, locale)).toBe(expected);
    });
});

describe('parsePastedAmount', () => {
    it.each([
        ['en-US', '1.23', '1.23'],
        ['en-US', '1,23', '123'],
        ['en-US', '1,234.56', '1234.56'],
        ['de-DE', '1,23', '1.23'],
        ['de-DE', '1.23', '123'],
        ['de-DE', '1.234,56', '1234.56'],
        ['de-DE', '1,234.56', '1.23456'],
        ['cs-CZ', '1.23', '123'],
        ['cs-CZ', '1 234,5', '1234.5'],
        ['cs-CZ', '1 234,5', '1234.5'],
    ])('should parse %s pasted text %s as %s', (locale, pastedText, expected) => {
        expect(parsePastedAmount(pastedText, getLocaleSeparators(locale))).toBe(expected);
    });
});

describe('getEditedRawAmount', () => {
    const editAmount = (
        locale: string,
        previousRawAmount: string,
        nextDisplayedAmount: string,
        limits: AmountLimits = {},
    ) =>
        getEditedRawAmount({
            previousDisplayedAmount: formatRawAmount(previousRawAmount, locale),
            nextDisplayedAmount,
            separators: getLocaleSeparators(locale),
            limits,
        });

    it.each([
        ['en-US', '12,'],
        ['en-US', '12.'],
        ['de-DE', '12,'],
        ['de-DE', '12.'],
    ])('should treat typed separator in %s (%s) as decimal', (locale, nextDisplayedAmount) => {
        expect(editAmount(locale, '12', nextDisplayedAmount)).toBe('12.');
    });

    it('should append a typed digit to a grouped amount', () => {
        expect(editAmount('en-US', '1234', '1,2345')).toBe('12345');
    });

    it.each([
        ['de-DE', '1.23', '123'],
        ['de-DE', '1,23', '1.23'],
        ['en-US', '1,23', '123'],
    ])('should parse %s pasted text %s by the locale', (locale, pastedText, expected) => {
        expect(editAmount(locale, '', pastedText)).toBe(expected);
    });

    it.each([
        ['en-US', '1234', '1,23', '123'],
        ['en-US', '12.', '12', '12'],
        ['en-US', '1', '', ''],
        ['de-DE', '1234.5', '1.234,', '1234.'],
    ])(
        'should delete from the end in %s: %s -> %s',
        (locale, previousRawAmount, nextDisplayedAmount, expected) => {
            expect(editAmount(locale, previousRawAmount, nextDisplayedAmount)).toBe(expected);
        },
    );

    it('should allow deleting from an amount exceeding limits', () => {
        expect(editAmount('en-US', '1.23456', '1.2345', { maxDecimals: 2 })).toBe('1.2345');
    });

    it.each([
        ['', '.', '0.'],
        ['0', '05', '5'],
        ['0', '00', '0'],
    ])(
        'should normalize %s edited to %s as %s',
        (previousRawAmount, nextDisplayedAmount, expected) => {
            expect(editAmount('en-US', previousRawAmount, nextDisplayedAmount)).toBe(expected);
        },
    );

    it.each<[string, string, string, AmountLimits]>([
        ['non-numeric text', '12', '12a', {}],
        ['second decimal separator', '1.', '1..', {}],
        ['typed decimal over limit', '1.23', '1.234', { maxDecimals: 2 }],
        ['pasted decimals over limit', '', '1.234', { maxDecimals: 2 }],
        ['decimal separator for integer amount', '12', '12.', { maxDecimals: 0 }],
        ['pasted decimal for integer amount', '', '1.5', { maxDecimals: 0 }],
        ['length over limit', '12345', '12,3456', { maxLength: 5 }],
        ['edit not at the end', '1234', '91,234', {}],
    ])('should reject %s', (_, previousRawAmount, nextDisplayedAmount, limits) => {
        expect(editAmount('en-US', previousRawAmount, nextDisplayedAmount, limits)).toBeNull();
    });
});

describe('getDisplayMaxLength', () => {
    it.each<[string, number | undefined, number | undefined]>([
        ['1,234', 2, undefined],
        ['1,234.5', undefined, undefined],
        ['1,234.5', 2, 8],
        ['1.23456', 2, 7],
    ])('should limit %s with %s max decimals to %s', (displayedAmount, maxDecimals, expected) => {
        expect(getDisplayMaxLength({ displayedAmount, decimalSeparator: '.', maxDecimals })).toBe(
            expected,
        );
    });
});
