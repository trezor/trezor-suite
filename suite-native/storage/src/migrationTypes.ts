import { type PersistedState } from 'redux-persist';

export type MigrationsManifest = {
    [key: number]: (state: PersistedState) => PersistedState | Promise<PersistedState>;
};

export const isPersistedState = (state: unknown): state is PersistedState =>
    typeof state === 'undefined' ||
    (typeof state === 'object' &&
        state !== null &&
        '_persist' in state &&
        typeof state._persist === 'object' &&
        state._persist !== null &&
        'version' in state._persist &&
        typeof state._persist.version === 'number' &&
        'rehydrated' in state._persist &&
        typeof state._persist.rehydrated === 'boolean');
