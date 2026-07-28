import { nonSanctionedRegional, regional } from './regional';

describe('Regional', () => {
    describe('isInEEA', () => {
        it('should test when country is in EEA', () => {
            const isIn = regional.isInEEA('DE');

            expect(isIn).toBe(true);
        });

        it('should test when country is not in EEA', () => {
            const isIn = regional.isInEEA('test');

            expect(isIn).toBe(false);
        });
    });

    describe('isSanctioned', () => {
        it('should be true for Comprehensively Sanctioned Countries', () => {
            const isSanctioned = regional.isSanctioned('KP');

            expect(isSanctioned).toBe(true);
        });

        it('should be true for Other Countries Subject to OFAC Sanctions', () => {
            const isSanctioned = regional.isSanctioned('SD');

            expect(isSanctioned).toBe(true);
        });

        it('should be false for non-sanctioned country', () => {
            const isSanctioned = regional.isSanctioned('DE');

            expect(isSanctioned).toBe(false);
        });
    });

    describe('getCountryOptionWithWorldwideFallback', () => {
        it('should return country option for existing country', () => {
            expect(regional.getCountryOptionWithWorldwideFallback('DE')).toEqual({
                codeAlpha3: 'DEU',
                flag: '🇩🇪',
                label: '🇩🇪 Germany',
                name: 'Germany',
                shortLabel: '🇩🇪 DEU',
                value: 'DE',
            });
        });

        it('should fallback to worldwide for non-existing country', () => {
            expect(regional.getCountryOptionWithWorldwideFallback('test')).toEqual({
                codeAlpha3: 'unknown',
                flag: '🌍',
                label: '🌍 Worldwide',
                name: 'Worldwide',
                shortLabel: '🌍 Worldwide',
                value: 'unknown',
            });
        });
    });

    describe('nonSanctionedRegional', () => {
        it('should not contain sanctioned countries', () => {
            const hasSanctionedCountries = nonSanctionedRegional.countriesOptions.some(
                ({ value }) => regional.isSanctioned(value),
            );

            expect(nonSanctionedRegional.countriesOptions.length).toBeGreaterThan(0);
            expect(hasSanctionedCountries).toBe(false);
        });
    });
});
