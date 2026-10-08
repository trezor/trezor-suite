import {
    EMPTY_RUNTIME_NETWORK_PREFERENCES,
    type RuntimeNetworkPreferences,
    type RuntimeNetworkPreferencesStore,
    withEnabled,
    withUserDefinition,
    withoutUserDefinition,
} from './RuntimeNetworkPreferences';

export type InMemoryRuntimeNetworkPreferencesStoreDeps = {
    /** Called with the new preferences after each of the user's changes, e.g. to persist them. */
    onChange?: (preferences: RuntimeNetworkPreferences) => void;
};

export type InMemoryRuntimeNetworkPreferencesStore = RuntimeNetworkPreferencesStore & {
    /** Replaces the preferences without calling `onChange`, e.g. once loaded from storage. */
    replace: (preferences: RuntimeNetworkPreferences) => void;
};

/**
 * Preferences held in memory. A platform that keeps them elsewhere loads them with `replace` and
 * writes them back from `onChange`; one that keeps them in its own state library implements the
 * store contract directly instead.
 */
export const createInMemoryRuntimeNetworkPreferencesStore = (
    deps: InMemoryRuntimeNetworkPreferencesStoreDeps = {},
): InMemoryRuntimeNetworkPreferencesStore => {
    const listeners = new Set<() => void>();
    let preferences = EMPTY_RUNTIME_NETWORK_PREFERENCES;

    const set = (next: RuntimeNetworkPreferences) => {
        preferences = next;
        listeners.forEach(listener => listener());
    };

    const change = (next: RuntimeNetworkPreferences) => {
        set(next);
        deps.onChange?.(next);
    };

    return {
        getSnapshot: () => preferences,
        subscribe: listener => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        replace: set,
        addUserDefinition: definition => change(withUserDefinition(preferences, definition)),
        removeUserDefinition: symbol => change(withoutUserDefinition(preferences, symbol)),
        setEnabled: (key, isEnabled) => change(withEnabled(preferences, key, isEnabled)),
    };
};
