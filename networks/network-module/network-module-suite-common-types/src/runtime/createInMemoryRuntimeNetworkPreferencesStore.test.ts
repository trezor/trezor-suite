import { createInMemoryRuntimeNetworkPreferencesStore } from './createInMemoryRuntimeNetworkPreferencesStore';

describe(createInMemoryRuntimeNetworkPreferencesStore.name, () => {
    it("publishes the user's changes and hands them over to be kept", () => {
        const onChange = jest.fn();
        const store = createInMemoryRuntimeNetworkPreferencesStore({ onChange });
        const listener = jest.fn();
        store.subscribe(listener);

        store.addUserDefinition({ symbol: 'abc' });
        store.setEnabled('user:abc', true);

        expect(store.getSnapshot()).toEqual({
            userDefinitions: [{ symbol: 'abc' }],
            enabled: ['user:abc'],
        });
        expect(listener).toHaveBeenCalledTimes(2);
        expect(onChange).toHaveBeenLastCalledWith(store.getSnapshot());
    });

    it('takes loaded preferences without handing them back', () => {
        const onChange = jest.fn();
        const store = createInMemoryRuntimeNetworkPreferencesStore({ onChange });
        const listener = jest.fn();
        store.subscribe(listener);
        const loaded = { userDefinitions: [], enabled: ['trezor:abc' as const] };

        store.replace(loaded);

        expect(store.getSnapshot()).toBe(loaded);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(onChange).not.toHaveBeenCalled();
    });
});
