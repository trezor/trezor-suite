import { combineReducers } from '@reduxjs/toolkit';
import Localization, { type Locale } from 'expo-localization';

import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';
import { residenceActions, residenceReducer } from '@suite-native/trading-state';

import { useLocationForm } from '../useLocationForm';

describe('useLocationForm', () => {
    let store: TestStore;

    const renderUseLocationForm = () =>
        renderHookWithStoreProvider(() => useLocationForm(), { store });

    beforeEach(() => {
        store = createLightStore({
            reducer: {
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                    trading: combineReducers({
                        residence: residenceReducer,
                    }),
                }),
            },
        });
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

    it('should use default subdivision value from redux state', () => {
        act(() => {
            store.dispatch(
                residenceActions.setResidenceLocation({
                    country: 'US',
                    countrySubdivision: 'CA',
                }),
            );
        });

        const { result } = renderUseLocationForm();

        expect(result.current.getValues('country')).toEqual(
            expect.objectContaining({
                value: 'US',
            }),
        );
        expect(result.current.getValues('countrySubdivision')).toEqual({
            value: 'CA',
            label: 'California',
            name: 'California',
        });
    });

    it('should ignore persisted subdivision when it does not belong to country', () => {
        act(() => {
            store.dispatch(
                residenceActions.setResidenceLocation({
                    country: 'CZ',
                    countrySubdivision: 'CA',
                }),
            );
        });

        const { result } = renderUseLocationForm();

        expect(result.current.getValues('countrySubdivision')).toBeUndefined();
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
