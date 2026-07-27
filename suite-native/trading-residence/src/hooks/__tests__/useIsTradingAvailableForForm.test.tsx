import { type TradingCountryCode } from '@suite-common/trading';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { LocationForm } from '../../components/LocationForm';
import { useIsTradingAvailableForForm } from '../useIsTradingAvailableForForm';

describe('useIsTradingAvailableForForm', () => {
    const renderUseIsTradingAvailableForForm = (preloadedState: Record<string, unknown>) =>
        renderHookWithStoreProvider(() => useIsTradingAvailableForForm(), {
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
        (expectedValue, country, countrySubdivision) => {
            const preloadedState = {
                wallet: { trading: { residence: { country, countrySubdivision } } },
            };

            const { result } = renderUseIsTradingAvailableForForm(preloadedState);

            expect(result.current).toEqual(expectedValue);
        },
    );
});
