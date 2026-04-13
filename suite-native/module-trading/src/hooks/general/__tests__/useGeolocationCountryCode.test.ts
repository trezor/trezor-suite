import { geolocationActions, selectCountryCode } from '@suite-common/geolocation';
import {
    type TestStore,
    initStore,
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
    const renderUseGeolocationCountryCode = (store: TestStore) =>
        renderHookWithStoreProvider(() => useGeolocationCountryCode(), { store });

    it('should call geolocation thunk on mount', () => {
        const { store } = initStore();

        renderUseGeolocationCountryCode(store);

        expect(selectCountryCode(store.getState())).toBe('US');
    });

    it('should not call geolocation thunk if country code is already known', () => {
        const { store } = initStore();
        store.dispatch(geolocationActions.setCountryCode('CZ'));

        renderUseGeolocationCountryCode(store);

        expect(selectCountryCode(store.getState())).toBe('CZ');
    });
});
