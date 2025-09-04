import { getCurrencyLabel } from '../currencyUtils';

describe('currencyUtils', () => {
    describe('getCurrencyLabel', () => {
        let consoleErrorSpy: jest.SpyInstance;

        beforeAll(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        beforeEach(() => {
            consoleErrorSpy.mockClear();
        });

        afterAll(() => {
            consoleErrorSpy.mockRestore();
        });

        it('should return label from supported currencies map', () => {
            expect(getCurrencyLabel('czk')).toBe('Czech Koruna');
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it('should return label from other currencies map', () => {
            expect(getCurrencyLabel('xof')).toBe('West African CFA Franc');
        });

        it('should be uppercase code otherwise', () => {
            expect(getCurrencyLabel('xyz')).toBe('XYZ');
        });

        it.each(['xof', 'xyz'])(
            'should log warning when currency is not supported, case %#',
            fiatCurrency => {
                getCurrencyLabel(fiatCurrency);

                expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    `Trading: Currency [${fiatCurrency}] is not in supportedFiatCurrenciesMap`,
                );
            },
        );
    });
});
