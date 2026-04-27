import { type TradingCountryCode } from '@suite-common/trading';

import { residenceActions, residenceReducer } from '../residenceSlice';

describe('residenceSlice', () => {
    it('should return the initial state', () => {
        const state = residenceReducer(undefined, { type: 'unknown-action' });
        expect(state).toEqual({
            country: undefined,
            countrySubdivision: undefined,
            wasOnboardingVisited: false,
        });
    });

    describe('setResidenceCountry', () => {
        it('should set the residence country', () => {
            const country: TradingCountryCode = 'CZ';

            const state = residenceReducer(
                undefined,
                residenceActions.setResidenceCountry(country),
            );

            expect(state.country).toBe(country);
            expect(state.countrySubdivision).toBeUndefined();
        });
    });

    describe('setResidenceLocation', () => {
        it('should set residence country and subdivision', () => {
            const country: TradingCountryCode = 'US';

            const state = residenceReducer(
                undefined,
                residenceActions.setResidenceLocation({
                    country,
                    countrySubdivision: 'CA',
                }),
            );

            expect(state.country).toBe(country);
            expect(state.countrySubdivision).toBe('CA');
        });
    });

    describe('setOnboardingVisited', () => {
        it('should set onboardingCompleted to true', () => {
            const state = residenceReducer(undefined, residenceActions.setOnboardingVisited());

            expect(state.wasOnboardingVisited).toBe(true);
        });
    });
});
