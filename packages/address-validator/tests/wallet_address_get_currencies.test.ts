import * as WAValidator from '../src';

describe('WAValidator.getCurrencies()', () => {
    it('Should get all currencies', () => {
        const currencies = WAValidator.getCurrencies();
        expect(currencies).toBeTruthy();
        expect(currencies.length).toBeGreaterThan(0);
    });

    it('Should find a specific currency by symbol', () => {
        const currency = WAValidator.findCurrency('xrp');
        expect(currency).toBeTruthy();
        expect(currency?.name).toBe('Ripple');
        expect(currency?.symbol).toBe('xrp');
    });

    it('Should find a specific currency by name', () => {
        const currency = WAValidator.findCurrency('Ripple');
        expect(currency).toBeTruthy();
        expect(currency?.name).toBe('Ripple');
        expect(currency?.symbol).toBe('xrp');
    });

    it('Should return null if currency is not found', () => {
        const currency = WAValidator.findCurrency('random');
        expect(currency).toBeNull();
    });
});
