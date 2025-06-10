import { geolocationActions, selectCountryCode } from '@suite-common/geolocation';
import { TestStore, initStore, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';

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
        renderHookWithStoreProviderAsync(() => useGeolocationCountryCode(), { store });

    it('should call geolocation thunk on mount', async () => {
        const store = await initStore();

        await renderUseGeolocationCountryCode(store);

        expect(selectCountryCode(store.getState())).toBe('US');
    });

    it('should not call geolocation thunk if country code is already known', async () => {
        const store = await initStore();
        store.dispatch(geolocationActions.setCountryCode('CZ'));

        await renderUseGeolocationCountryCode(store);

        expect(selectCountryCode(store.getState())).toBe('CZ');
    });
});
