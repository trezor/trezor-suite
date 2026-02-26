import Localization, { type Locale } from 'expo-localization';

import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderHookWithStoreProvider } from '@suite-native/test-utils/store';
import { residenceActions } from '@suite-native/trading-state';

import { useLocationForm } from '../useLocationForm';

describe('useLocationForm', () => {
    let store: TestStore;

    const renderUseLocationForm = () =>
        renderHookWithStoreProvider(() => useLocationForm(), { store });

    beforeEach(() => {
        store = initStore().store;
    });

    it('should use default value from redux state', () => {
        act(() => {
            store.dispatch(residenceActions.setResidenceCountry('CZ'));
        });

        const { result } = renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual(
            expect.objectContaining({
                value: 'CZ',
            }),
        );
    });

    it('should use value from expo-localization when country is not set in store', () => {
        const { result } = renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual(
            expect.objectContaining({
                value: 'PL',
            }),
        );
    });

    it('should fallback to worldwide when country is not set in store and expo-localization country is not supported', () => {
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

        const { result } = renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual(
            expect.objectContaining({
                value: 'unknown',
            }),
        );
    });
});
