import { PersistedState, getStoredState } from 'redux-persist';

import { isPersistedState } from '../../migrationTypes';
import { initMmkvStorage } from '../../storage';

type MigratedState = Partial<{ appLocaleCode: string; systemLocaleCode: string }> & PersistedState;

export const migrateLocaleTagToAppLocaleCode = async (
    oldState: unknown,
): Promise<MigratedState> => {
    if (!oldState || !isPersistedState(oldState)) {
        return oldState as MigratedState;
    }

    const localeState = await getStoredState({
        key: 'locale',
        storage: await initMmkvStorage(),
    });

    if (
        !localeState ||
        !('localeTag' in localeState) ||
        typeof localeState.localeTag !== 'string'
    ) {
        return oldState as MigratedState; // no new migration, just pass the previous one
    }

    return {
        ...oldState,
        appLocaleCode: localeState.localeTag,
    };
};
