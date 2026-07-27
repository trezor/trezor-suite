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

export const migrateBiometricsAtomToRedux = (oldState: unknown) => {
    if (!oldState || !isPersistedState(oldState)) {
        return undefined;
    }

    const storedValue = parseStoredBoolean(
        unecryptedJotaiStorage.getString(BIOMETRICS_PERSISTED_ATOM_STORAGE_KEY),
    );

    if (typeof storedValue !== 'boolean') {
        return undefined;
    }

    unecryptedJotaiStorage.remove(BIOMETRICS_PERSISTED_ATOM_STORAGE_KEY);

    return {
        ...oldState,
        isBiometricsEnabled: storedValue,
    };
};
