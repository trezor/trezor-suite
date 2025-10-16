import { TradingCountryCode } from '@suite-common/trading';
import {
    FeatureFlag,
    FeatureFlagsRootState,
    featureFlagsInitialState,
} from '@suite-native/feature-flags';

import {
    TradingResidenceRootState,
    TradingResidenceState,
    tradingResidenceInitialState,
} from '../../reducers/residenceSlice';
import {
    selectIsTradingEnabledForCountry,
    selectIsTradingResidenceCheckEnabled,
    selectTradingResidenceCountry,
    selectWasTradingResidenceOnboardingVisited,
} from '../residenceSelectors';

describe('residenceSelectors', () => {
    const visitedState: TradingResidenceState = {
        country: 'US',
        wasOnboardingVisited: true,
    };

    const getRootResidenceState = (
        overrides: Partial<TradingResidenceState>,
    ): TradingResidenceRootState => ({
        wallet: {
            trading: {
                residence: {
                    ...tradingResidenceInitialState,
                    ...overrides,
                },
            },
        },
    });

    const getRootFFState = (isResidenceCheckEnabled = false): FeatureFlagsRootState => ({
        featureFlags: {
            ...featureFlagsInitialState,
            [FeatureFlag.IsTradingResidenceCheckEnabled]: isResidenceCheckEnabled,
        },
    });

    describe('selectTradingResidenceCountry', () => {
        it(' should select the country', () => {
            expect(
                selectTradingResidenceCountry(getRootResidenceState(tradingResidenceInitialState)),
            ).toBe(undefined);
            expect(selectTradingResidenceCountry(getRootResidenceState(visitedState))).toBe('US');
        });
    });

    describe('selectWasTradingResidenceOnboardingVisited', () => {
        it('should select wasOnboardingVisited', () => {
            expect(
                selectWasTradingResidenceOnboardingVisited(
                    getRootResidenceState(tradingResidenceInitialState),
                ),
            ).toBe(false);
            expect(
                selectWasTradingResidenceOnboardingVisited(getRootResidenceState(visitedState)),
            ).toBe(true);
        });
    });

    describe('selectIsTradingResidenceCheckEnabled', () => {
        it.each([true, false])('should return correct flag state for FF [%s]', flag => {
            const ffState = getRootFFState(flag);

            expect(selectIsTradingResidenceCheckEnabled(ffState)).toBe(flag);
        });
    });

    describe('selectIsTradingEnabledForCountry', () => {
        it.each<TradingCountryCode | undefined>([undefined, 'unknown', 'US', 'SK'])(
            'should return true for country [%s] and FF disabled',
            countryCode => {
                const state = {
                    ...getRootResidenceState({ country: countryCode }),
                    ...getRootFFState(false),
                };
                expect(selectIsTradingEnabledForCountry(state)).toBe(true);
            },
        );

        it.each<TradingCountryCode>(['US', 'CZ'])(
            'should return true for whitelisted country [%s] and FF enabled',
            countryCode => {
                const state = {
                    ...getRootResidenceState({ country: countryCode }),
                    ...getRootFFState(true),
                };

                expect(selectIsTradingEnabledForCountry(state)).toBe(true);
            },
        );

        it.each<TradingCountryCode | undefined>([undefined, 'unknown', 'SK'])(
            'should return false for non-whitelisted country [%s] and FF enabled',
            countryCode => {
                const state = {
                    ...getRootResidenceState({ country: countryCode }),
                    ...getRootFFState(true),
                };

                expect(selectIsTradingEnabledForCountry(state)).toBe(false);
            },
        );
    });
});
