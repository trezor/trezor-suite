import { type PersistedState } from 'redux-persist';

import { unecryptedJotaiStorage } from '../../atomWithUnecryptedStorage';
import { isPersistedState } from '../../migrationTypes';

const parseStoredBoolean = (value: string | undefined | null): boolean | undefined => {
    if (!value) return undefined;

    try {
        const parsedValue = JSON.parse(value);

        return typeof parsedValue === 'boolean' ? parsedValue : undefined;
    } catch {
        return undefined;
    }
};

const BIOMETRICS_PERSISTED_ATOM_STORAGE_KEY = 'isBiometricsOptionEnabled';

export const migrateBiometricsAtomToRedux = (oldState: unknown): PersistedState => {
    if (!oldState || !isPersistedState(oldState)) {
        return oldState as PersistedState;
    }

    const storedValue = parseStoredBoolean(
        unecryptedJotaiStorage.getString(BIOMETRICS_PERSISTED_ATOM_STORAGE_KEY),
    );

    if (typeof storedValue !== 'boolean') {
        return oldState;
    }

    unecryptedJotaiStorage.remove(BIOMETRICS_PERSISTED_ATOM_STORAGE_KEY);

    return { ...oldState, isBiometricsEnabled: storedValue } as PersistedState;
};
