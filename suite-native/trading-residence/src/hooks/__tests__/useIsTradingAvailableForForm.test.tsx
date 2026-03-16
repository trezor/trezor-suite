import { type TradingCountryCode } from '@suite-common/trading';
import { type PreloadedState, renderHookWithStoreProvider } from '@suite-native/test-utils';

import { LocationForm } from '../../components/LocationForm';
import { useIsTradingAvailableForForm } from '../useIsTradingAvailableForForm';

describe('useIsTradingAvailableForForm', () => {
    const renderUseIsTradingAvailableForForm = (preloadedState: PreloadedState) =>
        renderHookWithStoreProvider(() => useIsTradingAvailableForForm(), {
            wrapper: LocationForm,
            preloadedState,
        });

    it.each<[boolean, TradingCountryCode | undefined]>([
        // Cuba is sanctioned, therefore form falls back to expo-localization country (PL)
        [true, 'CU'],
        // Zambia is not whitelisted
        [false, 'ZM'],
        // Worldwide is not whitelisted
        [false, 'unknown'],
        // Falls back to expo-localization country (PL)
        [true, undefined],
        // US is whitelisted
        [true, 'US'],
    ])('should be [%s] for country [%s]', (expectedValue, country) => {
        const preloadedState: PreloadedState = {
            wallet: { trading: { residence: { country } } },
        };

        const { result } = renderUseIsTradingAvailableForForm(preloadedState);

        expect(result.current).toEqual(expectedValue);
    });
});
