import { type PersistedState, getStoredState } from 'redux-persist';

import { type MMKVStorageDep, preparePersistReducer } from '@suite-native/storage';

import { solanaInitialState, solanaReducer } from './solanaSlice';

const LEGACY_BANNER_FLAGS_PERSIST_KEY = 'bannerFlags';
const SOLANA_PERSIST_KEY = 'solana';

type MigrateSolanaState = (state: PersistedState) => Promise<PersistedState>;
type MigrateSolanaStateDeps = MMKVStorageDep;
type PrepareSolanaReducerDeps = MMKVStorageDep;

const getIsLimitedHistoryBannerClosed = (state: unknown): boolean | undefined => {
    if (
        typeof state !== 'object' ||
        state === null ||
        !('isSolanaLimitedHistoryBannerClosed' in state)
    ) {
        return undefined;
    }

    const value = state.isSolanaLimitedHistoryBannerClosed;

    return typeof value === 'boolean' ? value : undefined;
};

const createMigrateSolanaState =
    (deps: MigrateSolanaStateDeps): MigrateSolanaState =>
    async (state: PersistedState): Promise<PersistedState> => {
        if (!state) {
            return state;
        }

        const legacyBannerFlagsState = await getStoredState({
            key: LEGACY_BANNER_FLAGS_PERSIST_KEY,
            storage: deps.mmkvStorage,
        });
        const isLimitedHistoryBannerClosed =
            getIsLimitedHistoryBannerClosed(legacyBannerFlagsState) ??
            solanaInitialState.isLimitedHistoryBannerClosed;

        return {
            ...state,
            isLimitedHistoryBannerClosed,
        };
    };

export const prepareSolanaReducer = (deps: PrepareSolanaReducerDeps) =>
    preparePersistReducer({
        reducer: solanaReducer,
        key: SOLANA_PERSIST_KEY,
        persistedKeys: ['isLimitedHistoryBannerClosed'],
        version: 1,
        migrations: {
            1: createMigrateSolanaState(deps),
        },
        storage: deps.mmkvStorage,
    });
