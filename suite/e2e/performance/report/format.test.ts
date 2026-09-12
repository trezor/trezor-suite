import { formatPercent, formatValue, verdictSentence } from './format';

describe('formatValue', () => {
    it('groups thousands in milliseconds', () => {
        expect(formatValue(2063.4, 'ms')).toBe('2 063 ms');
    });

    it('scales bytes to KB and MB', () => {
        expect(formatValue(801598, 'bytes')).toBe('783 KB');
        expect(formatValue(3 * 1024 * 1024, 'bytes')).toBe('3.0 MB');
    });

    it('keeps unitless values fractional', () => {
        expect(formatValue(0.0672, 'unitless')).toBe('0.067');
    });
});

describe('formatPercent', () => {
    it('signs a rise and a drop', () => {
        expect(formatPercent(1000, 1250)).toBe('+25%');
        expect(formatPercent(1000, 850)).toBe('−15%');
    });

    it('says nothing about a change from zero', () => {
        // Any change from zero is infinitely many percent, so the absolute delta speaks alone.
        expect(formatPercent(0, 4)).toBe('');
    });
});

describe('verdictSentence', () => {
    it('pluralizes each count on its own', () => {
        expect(verdictSentence({ regressions: 1, improvements: 2, noise: 0 })).toBe(
            '1 regression, 2 improvements, 0 within noise.',
        );
    });
});
