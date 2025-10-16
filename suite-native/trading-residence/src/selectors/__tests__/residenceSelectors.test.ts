import {
    TradingResidenceRootState,
    TradingResidenceState,
    tradingResidenceInitialState,
} from '../../reducers/residenceSlice';
import {
    selectTradingResidenceCountry,
    selectWasTradingResidenceOnboardingVisited,
} from '../residenceSelectors';

describe('residenceSelectors', () => {
    const visitedState: TradingResidenceState = {
        country: 'US',
        wasOnboardingVisited: true,
    };

    const rootState = (residence: TradingResidenceState): TradingResidenceRootState => ({
        wallet: { trading: { residence } },
    });

    describe('selectTradingResidenceCountry', () => {
        it(' should select the country', () => {
            expect(selectTradingResidenceCountry(rootState(tradingResidenceInitialState))).toBe(
                undefined,
            );
            expect(selectTradingResidenceCountry(rootState(visitedState))).toBe('US');
        });
    });

    describe('selectWasTradingResidenceOnboardingVisited', () => {
        it('should select wasOnboardingVisited', () => {
            expect(
                selectWasTradingResidenceOnboardingVisited(rootState(tradingResidenceInitialState)),
            ).toBe(false);
            expect(selectWasTradingResidenceOnboardingVisited(rootState(visitedState))).toBe(true);
        });
    });
});
