import { TradingCountryCode } from '@suite-common/trading';
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

import { LocationForm } from '../../components/LocationForm';
import { useIsTradingAvailableForForm } from '../useIsTradingAvailableForForm';

describe('useIsTradingAvailableForForm', () => {
    const renderUseIsTradingAvailableForForm = (preloadedState: PreloadedState) =>
        renderHookWithStoreProviderAsync(() => useIsTradingAvailableForForm(), {
            wrapper: LocationForm,
            preloadedState,
        });

    it.each<[boolean, TradingCountryCode | undefined]>([
        [false, 'CU'],
        [false, 'SK'],
        [false, 'unknown'],
        [false, undefined],
        [true, 'US'],
    ])('should be [%s] for country [%s]', async (expectedValue, country) => {
        const preloadedState: PreloadedState = {
            wallet: { trading: { residence: { country } } },
        };

        const { result } = await renderUseIsTradingAvailableForForm(preloadedState);

        expect(result.current).toEqual(expectedValue);
    });
});
