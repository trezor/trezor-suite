import Localization, { type Locale } from 'expo-localization';

import {
    TestStore,
    act,
    initStore,
    renderHookWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { tradingResidenceActions } from '../../reducers/residenceSlice';
import { useLocationForm } from '../useLocationForm';

describe('useLocationForm', () => {
    let store: TestStore;

    const renderUseLocationForm = () =>
        renderHookWithStoreProviderAsync(() => useLocationForm(), { store });

    beforeEach(async () => {
        store = await initStore();
    });

    it('should use default value from redux state', async () => {
        act(() => {
            store.dispatch(tradingResidenceActions.setResidenceCountry('CZ'));
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
