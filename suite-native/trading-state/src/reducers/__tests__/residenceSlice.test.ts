import { type TradingCountryCode } from '@suite-common/trading';

import { residenceActions, residenceReducer } from '../residenceSlice';

describe('residenceSlice', () => {
    it('should return the initial state', () => {
        const state = residenceReducer(undefined, { type: 'unknown-action' });
        expect(state).toEqual({
            country: undefined,
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
        });
    });

    describe('setOnboardingVisited', () => {
        it('should set onboardingCompleted to true', () => {
            const state = residenceReducer(undefined, residenceActions.setOnboardingVisited());

            expect(state.wasOnboardingVisited).toBe(true);
        });
    });
});
