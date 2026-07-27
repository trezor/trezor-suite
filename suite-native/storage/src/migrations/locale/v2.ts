import { type PersistedState } from 'redux-persist';

import { isPersistedState } from '../../migrationTypes';

type MigratedState = Partial<{ appLocaleCode: string; systemLocaleCode: string }> & PersistedState;

export const migrateLocaleTagToAppLocaleCode = (oldState: unknown): MigratedState => {
    if (
        !oldState ||
        !isPersistedState(oldState) ||
        !('localeTag' in oldState) ||
        typeof oldState.localeTag !== 'string'
    ) {
        return oldState as MigratedState; // no new migration, just pass the previous one
    }

    return {
        ...oldState,
        appLocaleCode: oldState.localeTag,
    };
};
