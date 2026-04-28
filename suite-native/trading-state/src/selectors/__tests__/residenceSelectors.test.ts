import { type TradingCountryCode } from '@suite-common/trading';
import {
    FeatureFlag,
    type FeatureFlagsRootState,
    featureFlagsInitialState,
} from '@suite-native/feature-flags';
import { tradingInitialState } from '@suite-native/trading-consts';
import {
    type TradingResidenceRootState,
    type TradingResidenceState,
} from '@suite-native/trading-types';

import {
    selectIsTradingCountrySet,
    selectIsTradingEnabledForCountry,
    selectIsTradingResidenceCheckEnabled,
    selectShouldDisplayTradingResidenceOnboarding,
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
    selectWasTradingResidenceOnboardingVisited,
} from '../residenceSelectors';

describe('residenceSelectors', () => {
    const visitedState: TradingResidenceState = {
        country: 'US',
        countrySubdivision: 'CA',
        wasOnboardingVisited: true,
    };

    const getRootResidenceState = (
        overrides: Partial<TradingResidenceState>,
    ): TradingResidenceRootState => ({
        wallet: {
            trading: {
                residence: {
                    ...tradingInitialState.residence,
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
        it('should select the country', () => {
            expect(
                selectTradingResidenceCountry(getRootResidenceState(tradingInitialState.residence)),
            ).toBe(undefined);
            expect(selectTradingResidenceCountry(getRootResidenceState(visitedState))).toBe('US');
        });
    });

    describe('selectTradingResidenceCountrySubdivision', () => {
        it('should select the country subdivision', () => {
            expect(
                selectTradingResidenceCountrySubdivision(
                    getRootResidenceState(tradingInitialState.residence),
                ),
            ).toBe(undefined);
            expect(
                selectTradingResidenceCountrySubdivision(getRootResidenceState(visitedState)),
            ).toBe('CA');
        });
    });

    describe('selectWasTradingResidenceOnboardingVisited', () => {
        it('should select wasOnboardingVisited', () => {
            expect(
                selectWasTradingResidenceOnboardingVisited(
                    getRootResidenceState(tradingInitialState.residence),
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

        it.each<{ countryCode: TradingCountryCode; countrySubdivision?: string }>([
            { countryCode: 'US', countrySubdivision: 'CA' },
            { countryCode: 'CZ' },
        ])(
            'should return true for whitelisted country [%s] and FF enabled',
            ({ countryCode, countrySubdivision }) => {
                const state = {
                    ...getRootResidenceState({ country: countryCode, countrySubdivision }),
                    ...getRootFFState(true),
                };

                expect(selectIsTradingEnabledForCountry(state)).toBe(true);
            },
        );

        it.each<TradingCountryCode | undefined>([undefined, 'unknown', 'ZM'])(
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

    describe('selectIsTradingCountrySet', () => {
        it('should be false when selected country is undefined', () => {
            const state = getRootResidenceState({ country: undefined });

            expect(selectIsTradingCountrySet(state)).toBe(false);
        });

        it('should be true when selected country is defined', () => {
            const state = getRootResidenceState({ country: 'US', countrySubdivision: 'CA' });

            expect(selectIsTradingCountrySet(state)).toBe(true);
        });

        it('should be false when selected country is defined but country subdivision is empty', () => {
            const state = getRootResidenceState({ country: 'US', countrySubdivision: undefined });

            expect(selectIsTradingCountrySet(state)).toBe(false);
        });
    });

    describe('selectShouldDisplayTradingResidenceOnboarding', () => {
        it('should return false when residence check FF is disabled', () => {
            const state = {
                ...getRootResidenceState(tradingInitialState.residence),
                ...getRootFFState(false),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(false);
        });

        it('should return false when onboarding was already visited (FF enabled)', () => {
            const state = {
                ...getRootResidenceState(visitedState),
                ...getRootFFState(true),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(false);
        });

        it('should return false when country is already set (FF enabled)', () => {
            const state = {
                ...getRootResidenceState({ country: 'US', countrySubdivision: 'CA' }),
                ...getRootFFState(true),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(false);
        });

        it('should return true when FF enabled, onboarding not visited and country not set', () => {
            const state = {
                ...getRootResidenceState(tradingInitialState.residence),
                ...getRootFFState(true),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(true);
        });
    });
});
