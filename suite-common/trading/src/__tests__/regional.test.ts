import { regional } from '../regional';

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

    describe('isSanctionedCountry', () => {
        it('should be true for Comprehensively Sanctioned Countries', () => {
            const isSanctioned = regional.isSanctionedCountry('KP');

            expect(isSanctioned).toBe(true);
        });

        it('should be true for Other Countries Subject to OFAC Sanctions', () => {
            const isSanctioned = regional.isSanctionedCountry('SD');

            expect(isSanctioned).toBe(true);
        });

        it('should be false for non-sanctioned country', () => {
            const isSanctioned = regional.isSanctionedCountry('DE');

            expect(isSanctioned).toBe(false);
        });
    });

    describe('nonSanctionedCountries', () => {
        it('should not contain sanctioned countries', () => {
            const hasSanctionedCountries = regional.nonSanctionedCountries.some(country =>
                regional.isSanctionedCountry(country.value),
            );

            expect(regional.nonSanctionedCountries.length).toBeGreaterThan(0);
            expect(hasSanctionedCountries).toBe(false);
        });
    });
});
