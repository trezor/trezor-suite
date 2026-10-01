import {
    Feature,
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type TradingCountryCode } from '@suite-common/trading';
import { tradingInitialState } from '@suite-native/trading-consts';
import {
    type TradingResidenceRootState,
    type TradingResidenceState,
} from '@suite-native/trading-types';

import { selectIsTradingResidenceCheckEnabled } from './residenceCheck';
import {
    selectIsTradingCountrySet,
    selectIsTradingEnabledForCountry,
    selectShouldDisplayTradingResidenceOnboarding,
    selectTradingResidenceCountry,
    selectTradingResidenceCountrySubdivision,
    selectTradingResidenceWhitelist,
    selectWasTradingResidenceOnboardingVisited,
} from './residenceSelectors';

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

    const residenceDomain = Feature.trading.restrictions.residence;
    const whitelistPayload = { countries: ['US', 'CZ'] };

    const getRootMessageSystemState = (
        isResidenceCheckEnabled: boolean,
        payload?: Record<string, unknown>,
    ): MessageSystemRootState => ({
        messageSystem: mockMessageSystemStateWithFeatureFlags(
            { [residenceDomain]: isResidenceCheckEnabled },
            { [residenceDomain]: payload },
        ),
    });

    const getRootResidenceCheckState = (isResidenceCheckEnabled = false): MessageSystemRootState =>
        isResidenceCheckEnabled
            ? getRootMessageSystemState(true, whitelistPayload)
            : { messageSystem: messageSystemInitialState };

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
        it.each([true, false])(
            'should return residence check state [%s] when message is present',
            isEnabled => {
                const state = getRootMessageSystemState(isEnabled, whitelistPayload);

                expect(selectIsTradingResidenceCheckEnabled(state)).toBe(isEnabled);
            },
        );

        it('should return false when residence check message is absent', () => {
            expect(
                selectIsTradingResidenceCheckEnabled({ messageSystem: messageSystemInitialState }),
            ).toBe(false);
        });
    });

    describe('selectTradingResidenceWhitelist', () => {
        it('should return countries from the residence check payload', () => {
            const state = getRootMessageSystemState(true, { countries: ['US', 'CZ', 'ZZ'] });

            expect(selectTradingResidenceWhitelist(state)).toEqual(new Set(['US', 'CZ']));
        });

        it('should return an empty whitelist when residence check message is absent', () => {
            expect(
                selectTradingResidenceWhitelist({ messageSystem: messageSystemInitialState }).size,
            ).toBe(0);
        });

        it('should return the same whitelist instance for the same state', () => {
            const state = getRootMessageSystemState(true, whitelistPayload);

            expect(selectTradingResidenceWhitelist(state)).toBe(
                selectTradingResidenceWhitelist(state),
            );
        });
    });

    describe('selectIsTradingEnabledForCountry', () => {
        it.each<TradingCountryCode | undefined>([undefined, 'unknown', 'US', 'SK'])(
            'should return true for country [%s] and residence check disabled',
            countryCode => {
                const state = {
                    ...getRootResidenceState({ country: countryCode }),
                    ...getRootResidenceCheckState(false),
                };
                expect(selectIsTradingEnabledForCountry(state)).toBe(true);
            },
        );

        it.each<{ countryCode: TradingCountryCode; countrySubdivision?: string }>([
            { countryCode: 'US', countrySubdivision: 'CA' },
            { countryCode: 'CZ' },
        ])(
            'should return true for whitelisted country [%s] and residence check enabled',
            ({ countryCode, countrySubdivision }) => {
                const state = {
                    ...getRootResidenceState({ country: countryCode, countrySubdivision }),
                    ...getRootResidenceCheckState(true),
                };

                expect(selectIsTradingEnabledForCountry(state)).toBe(true);
            },
        );

        it.each<TradingCountryCode | undefined>([undefined, 'unknown', 'ZM'])(
            'should return false for non-whitelisted country [%s] and residence check enabled',
            countryCode => {
                const state = {
                    ...getRootResidenceState({ country: countryCode }),
                    ...getRootResidenceCheckState(true),
                };

                expect(selectIsTradingEnabledForCountry(state)).toBe(false);
            },
        );

        it.each<[string, Record<string, unknown> | undefined]>([
            ['missing payload', undefined],
            ['empty countries', { countries: [] }],
            ['malformed countries', { countries: 'CZ' }],
        ])('should return false for residence check enabled with %s', (_description, payload) => {
            const state = {
                ...getRootResidenceState({ country: 'CZ' }),
                ...getRootMessageSystemState(true, payload),
            };

            expect(selectIsTradingEnabledForCountry(state)).toBe(false);
        });

        it('should return true for non-whitelisted country when residence check flag is false', () => {
            const state = {
                ...getRootResidenceState({ country: 'ZM' }),
                ...getRootMessageSystemState(false, whitelistPayload),
            };

            expect(selectIsTradingEnabledForCountry(state)).toBe(true);
        });
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
        it('should return false when residence check is disabled', () => {
            const state = {
                ...getRootResidenceState(tradingInitialState.residence),
                ...getRootResidenceCheckState(false),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(false);
        });

        it('should return false when onboarding was already visited (residence check enabled)', () => {
            const state = {
                ...getRootResidenceState(visitedState),
                ...getRootResidenceCheckState(true),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(false);
        });

        it('should return false when country is already set (residence check enabled)', () => {
            const state = {
                ...getRootResidenceState({ country: 'US', countrySubdivision: 'CA' }),
                ...getRootResidenceCheckState(true),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(false);
        });

        it('should return true when residence check enabled, onboarding not visited and country not set', () => {
            const state = {
                ...getRootResidenceState(tradingInitialState.residence),
                ...getRootResidenceCheckState(true),
            };

            expect(selectShouldDisplayTradingResidenceOnboarding(state)).toBe(true);
        });
    });
});
