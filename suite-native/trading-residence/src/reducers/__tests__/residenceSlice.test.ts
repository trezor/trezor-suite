import { TradingCountryCode } from '@suite-common/trading';

import {
    tradingResidenceActions,
    tradingResidenceInitialState,
    tradingResidenceReducer,
} from '../residenceSlice';

describe('residenceSlice', () => {
    describe('setResidenceCountry', () => {
        it('should set the residence country', () => {
            const prevState = { ...tradingResidenceInitialState };
            const country: TradingCountryCode = 'CZ';
            const state = tradingResidenceReducer(
                prevState,
                tradingResidenceActions.setResidenceCountry(country),
            );
            expect(state.country).toBe(country);
        });
    });

    describe('setOnboardingVisited', () => {
        it('should set onboardingCompleted to true', () => {
            const prevState = { ...tradingResidenceInitialState };
            const state = tradingResidenceReducer(
                prevState,
                tradingResidenceActions.setOnboardingVisited(),
            );
            expect(state.onboardingCompleted).toBe(true);
        });
    });
});
