import { createFormatAmount, getDaysUntil } from './utils';

describe(getDaysUntil.name, () => {
    const NOW = new Date('2026-01-15T12:00:00Z').getTime();

    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each([
        ['returns 1 for a full day', '2026-01-16T12:00:00Z', 1],
        ['returns 1 for a partial day', '2026-01-16T11:59:59Z', 1],
        ['returns 0 for today', '2026-01-15T12:00:00Z', 0],
        ['returns 0 for a past date', '2026-01-14T12:00:00Z', 0],
    ])('%s', (_, date, expected) => {
        expect(getDaysUntil(date)).toBe(expected);
    });
});

describe(createFormatAmount.name, () => {
    it('formats an amount as a currency string without fractional digits', () => {
        const formatAmount = createFormatAmount('USD');

        expect(formatAmount(0.49)).toBe('$0');
        expect(formatAmount(20.99)).toBe('$21');
        expect(formatAmount(1000)).toBe('$1,000');
    });
});
