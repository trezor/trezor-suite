import { TradingCountryCode } from '@suite-common/trading';

import { tradingResidenceActions, tradingResidenceReducer } from '../residenceSlice';

describe('residenceSlice', () => {
    it('should return the initial state', () => {
        const state = tradingResidenceReducer(undefined, { type: 'unknown-action' });
        expect(state).toEqual({
            country: undefined,
            wasOnboardingVisited: false,
        });
    });

    describe('setResidenceCountry', () => {
        it('should set the residence country', () => {
            const country: TradingCountryCode = 'CZ';

            const state = tradingResidenceReducer(
                undefined,
                tradingResidenceActions.setResidenceCountry(country),
            );

            expect(state.country).toBe(country);
        });
    });

    describe('setOnboardingVisited', () => {
        it('should set onboardingCompleted to true', () => {
            const state = tradingResidenceReducer(
                undefined,
                tradingResidenceActions.setOnboardingVisited(),
            );

            expect(state.wasOnboardingVisited).toBe(true);
        });
    });
});
