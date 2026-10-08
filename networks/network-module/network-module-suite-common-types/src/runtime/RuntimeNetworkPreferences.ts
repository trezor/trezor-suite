import type { ExternalStore } from '../ExternalStore';

/** Who defined a network the app learned of at runtime: Trezor's signed list, or the user. */
export type RuntimeNetworkSource = 'trezor' | 'user';

/**
 * A runtime network as the user's consent names it: its source and symbol. A network defined
 * elsewhere under the same symbol is never on because this one is.
 */
export type RuntimeNetworkKey = `${RuntimeNetworkSource}:${string}`;

export const getRuntimeNetworkKey = (
    source: RuntimeNetworkSource,
    symbol: string,
): RuntimeNetworkKey => `${source}:${symbol}`;

/**
 * What the user decided about runtime networks. Definitions are kept as given and checked on
 * every read, so a later release can refuse one (e.g. a symbol it now builds in).
 */
export type RuntimeNetworkPreferences = {
    readonly userDefinitions: readonly unknown[];
    readonly enabled: readonly RuntimeNetworkKey[];
};

export const EMPTY_RUNTIME_NETWORK_PREFERENCES: RuntimeNetworkPreferences = {
    userDefinitions: [],
    enabled: [],
};

/** A user-defined network, as far as the preferences need to know it. */
export type RuntimeNetworkUserDefinition = { readonly symbol: string };

/**
 * Where a platform keeps the user's runtime network preferences. How it keeps them (a database, a
 * key-value store, memory) is the platform's choice; the transitions below are shared.
 */
export type RuntimeNetworkPreferencesStore = ExternalStore<RuntimeNetworkPreferences> & {
    /** Adds a definition, replacing the user's own one with the same symbol. Off until enabled. */
    addUserDefinition: (definition: RuntimeNetworkUserDefinition) => void;

    /** Forgets a definition and that it was on. */
    removeUserDefinition: (symbol: string) => void;
    setEnabled: (key: RuntimeNetworkKey, isEnabled: boolean) => void;
};

const hasSymbol = (definition: unknown, symbol: string) =>
    typeof definition === 'object' &&
    definition !== null &&
    (definition as { symbol?: unknown }).symbol === symbol;

export const withUserDefinition = (
    preferences: RuntimeNetworkPreferences,
    definition: RuntimeNetworkUserDefinition,
): RuntimeNetworkPreferences => ({
    ...preferences,
    userDefinitions: [
        ...preferences.userDefinitions.filter(stored => !hasSymbol(stored, definition.symbol)),
        definition,
    ],
});

export const withoutUserDefinition = (
    preferences: RuntimeNetworkPreferences,
    symbol: string,
): RuntimeNetworkPreferences => ({
    userDefinitions: preferences.userDefinitions.filter(stored => !hasSymbol(stored, symbol)),
    enabled: preferences.enabled.filter(key => key !== getRuntimeNetworkKey('user', symbol)),
});

export const withEnabled = (
    preferences: RuntimeNetworkPreferences,
    key: RuntimeNetworkKey,
    isEnabled: boolean,
): RuntimeNetworkPreferences => {
    const others = preferences.enabled.filter(enabledKey => enabledKey !== key);

    return { ...preferences, enabled: isEnabled ? [...others, key] : others };
};
