import Localization, { type Locale } from 'expo-localization';

import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';
import { residenceActions } from '@suite-native/trading-state';

import { useLocationForm } from '../useLocationForm';

describe('useLocationForm', () => {
    let store: TestStore;

    const renderUseLocationForm = () =>
        renderHookWithStoreProviderAsync(() => useLocationForm(), { store });

    beforeEach(() => {
        store = initStore().store;
    });

    it('should use default value from redux state', async () => {
        act(() => {
            store.dispatch(residenceActions.setResidenceCountry('CZ'));
        });

        const { result } = await renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual({
            label: '🇨🇿 Czech Republic',
            value: 'CZ',
        });
    });

    it('should use value from expo-localization when country is not set in store', async () => {
        const { result } = await renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual({
            label: '🇵🇱 Poland',
            value: 'PL',
        });
    });

    it('should fallback to worldwide when country is not set in store and expo-localization country is not supported', async () => {
        jest.spyOn(Localization, 'getLocales').mockReturnValue([
            {
                languageTag: 'es-CU',
                languageCode: 'es',
                textDirection: 'ltr',
                digitGroupingSeparator: ' ',
                decimalSeparator: ',',
                measurementSystem: 'metric',
                currencyCode: 'CUP',
                currencySymbol: '$',
                regionCode: 'CU',
                temperatureUnit: 'celsius',
            } as unknown as Locale,
        ]);

        const { result } = await renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual({
            label: '🌍 Worldwide',
            value: 'unknown',
        });
    });
});
