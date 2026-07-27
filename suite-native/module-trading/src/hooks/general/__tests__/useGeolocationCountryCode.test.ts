import { combineReducers } from '@reduxjs/toolkit';

import {
    geolocationActions,
    geolocationReducer,
    selectCountryCode,
} from '@suite-common/geolocation';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { localeReducer } from '@suite-native/intl';
import {
    type TestStore,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useGeolocationCountryCode } from '../useGeolocationCountryCode';

jest.mock('@suite-common/geolocation', () => {
    const actual = jest.requireActual('@suite-common/geolocation');

    return {
        ...actual,
        fetchCountryCodeThunk: jest
            .fn()
            .mockImplementation(() => actual.geolocationActions.setCountryCode('US')),
    };
});

describe('useGeolocationCountryCode', () => {
    const createGeolocationTestStore = () =>
        createLightStore({
            reducer: {
                geolocation: geolocationReducer,
                locale: localeReducer,
                wallet: combineReducers({
                    settings: createStaticReducer(initialWalletSettingsState),
                }),
            },
        });

    const renderUseGeolocationCountryCode = (store: TestStore) =>
        renderHookWithStoreProvider(() => useGeolocationCountryCode(), { store });

    it('should call geolocation thunk on mount', () => {
        const store = createGeolocationTestStore();

        renderUseGeolocationCountryCode(store);

        expect(selectCountryCode(store.getState())).toBe('US');
    });

    it('should not call geolocation thunk if country code is already known', () => {
        const store = createGeolocationTestStore();
        store.dispatch(geolocationActions.setCountryCode('CZ'));

        renderUseGeolocationCountryCode(store);

        expect(selectCountryCode(store.getState())).toBe('CZ');
    });
});
