import { Feature, messageSystemInitialState } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type TradingCountryCode } from '@suite-common/trading';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useIsTradingAvailableForForm } from './useIsTradingAvailableForForm';
import { LocationForm } from '../components/LocationForm';

describe('useIsTradingAvailableForForm', () => {
    const residenceDomain = Feature.trading.restrictions.residence;
    const residenceCheckMessageSystemState = mockMessageSystemStateWithFeatureFlags(
        { [residenceDomain]: true },
        { [residenceDomain]: { countries: ['PL', 'US'] } },
    );

    const renderUseIsTradingAvailableForForm = async (preloadedState: Record<string, unknown>) =>
        await renderHookWithStoreProvider(() => useIsTradingAvailableForForm(), {
            wrapper: LocationForm,
            preloadedState,
        });

    it.each<[boolean, TradingCountryCode | undefined, string | undefined]>([
        // Cuba is sanctioned, therefore form falls back to expo-localization country (PL)
        [true, 'CU', undefined],
        // Zambia is not whitelisted
        [false, 'ZM', undefined],
        // Worldwide is not whitelisted
        [false, 'unknown', undefined],
        // Falls back to expo-localization country (PL)
        [true, undefined, undefined],
        // US needs a state to be selected.
        [false, 'US', undefined],
        [true, 'US', 'CA'],
    ])(
        'should be [%s] for country [%s] and subdivision [%s]',
        async (expectedValue, country, countrySubdivision) => {
            const preloadedState = {
                messageSystem: residenceCheckMessageSystemState,
                wallet: { trading: { residence: { country, countrySubdivision } } },
            };

            const { result } = await renderUseIsTradingAvailableForForm(preloadedState);

            expect(result.current).toEqual(expectedValue);
        },
    );

    it('should be true when residence check message is absent', async () => {
        const preloadedState = {
            messageSystem: messageSystemInitialState,
            wallet: { trading: { residence: { country: 'ZM' } } },
        };

        const { result } = await renderUseIsTradingAvailableForForm(preloadedState);

        expect(result.current).toBe(true);
    });

    it('should be true for non-whitelisted country when residence check flag is false', async () => {
        const preloadedState = {
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                { [residenceDomain]: false },
                { [residenceDomain]: { countries: ['PL', 'US'] } },
            ),
            wallet: { trading: { residence: { country: 'ZM' } } },
        };

        const { result } = await renderUseIsTradingAvailableForForm(preloadedState);

        expect(result.current).toBe(true);
    });

    it('should be false when residence check is enabled with an empty whitelist', async () => {
        const preloadedState = {
            messageSystem: mockMessageSystemStateWithFeatureFlags(
                { [residenceDomain]: true },
                { [residenceDomain]: { countries: [] } },
            ),
            wallet: { trading: { residence: { country: 'US', countrySubdivision: 'CA' } } },
        };

        const { result } = await renderUseIsTradingAvailableForForm(preloadedState);

        expect(result.current).toBe(false);
    });
});
