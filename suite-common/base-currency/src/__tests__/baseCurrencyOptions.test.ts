import {
    buildCurrencyLongOption,
    buildCurrencyOptions,
    buildCurrencyShortOption,
} from '../baseCurrencyOptions';

describe('base currency options', () => {
    it('builds short option', () => {
        expect(buildCurrencyShortOption({ currency: 'usd', areSatsDisplayed: false })).toEqual({
            value: 'usd',
            label: 'USD',
        });
    });

    it('builds sats short option for BTC when sats are displayed', () => {
        expect(buildCurrencyShortOption({ currency: 'btc', areSatsDisplayed: true })).toEqual({
            value: 'btc',
            label: 'sat',
        });
    });

    it('builds long option', () => {
        expect(buildCurrencyLongOption({ currency: 'usd', areSatsDisplayed: false })).toEqual({
            value: 'usd',
            label: 'USD · United States Dollar',
        });
    });

    it('builds options without selected currency', () => {
        expect(
            buildCurrencyOptions({
                selected: { value: 'usd', label: 'USD' },
                areSatsDisplayed: false,
            }),
        ).not.toContainEqual({ value: 'usd', label: 'USD · United States Dollar' });
    });
});
