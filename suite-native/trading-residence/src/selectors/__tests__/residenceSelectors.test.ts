import type {
    TradingResidenceRootState,
    TradingResidenceState,
} from '../../reducers/residenceSlice';
import {
    selectTradingResidenceCountry,
    selectWasTradingResidenceOnboardingVisited,
} from '../residenceSelectors';

describe('residenceSelectors', () => {
    const initialState: TradingResidenceState = {
        country: 'unknown',
        onboardingCompleted: false,
    };
    const visitedState: TradingResidenceState = {
        country: 'US',
        onboardingCompleted: true,
    };

    const rootState = (residence: TradingResidenceState): TradingResidenceRootState => ({
        wallet: { trading: { residence } },
    });

    describe('selectTradingResidenceCountry', () => {
        it(' should select the country', () => {
            expect(selectTradingResidenceCountry(rootState(initialState))).toBe('unknown');
            expect(selectTradingResidenceCountry(rootState(visitedState))).toBe('US');
        });
    });

    describe('selectWasTradingResidenceOnboardingVisited', () => {
        it('should select onboardingCompleted', () => {
            expect(selectWasTradingResidenceOnboardingVisited(rootState(initialState))).toBe(false);
            expect(selectWasTradingResidenceOnboardingVisited(rootState(visitedState))).toBe(true);
        });
    });
});
