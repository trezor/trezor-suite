import { isCodesignBuild } from '@trezor/env-utils';
import { TOR_URLS } from '@trezor/urls';
import { isNotNull, typedObjectValues, urlToOnion } from '@trezor/utils';

import { type WithSuiteSyncState } from '../suiteSyncSlice';

// The `https://suite-sync.trezor.io/` MUST have the last `/` in the URL.

type Environment = 'dev' | 'local' | 'prod';

type TorVariant = 'clearnet' | 'onion';

type SuiteSyncRelayUrlMap = Record<Environment, Record<TorVariant, string>>;

type GetSuiteSyncRelayUrlParams = {
    env: Environment;
    isTorEnabled: boolean;
};

const LOCAL_SUITE_SYNC_RELAY_URL = 'http://127.0.0.1:4000/evolu/';

const DEFAULT_SUITE_SYNC_RELAY_URL_DEV = 'https://suite-sync-dev.suite.sldev.cz/evolu/';

const DEFAULT_SUITE_SYNC_RELAY_URL_DEV_ONION =
    urlToOnion(DEFAULT_SUITE_SYNC_RELAY_URL_DEV, TOR_URLS) ?? DEFAULT_SUITE_SYNC_RELAY_URL_DEV;

const DEFAULT_SUITE_SYNC_RELAY_URL_PROD = 'https://suite-sync.trezor.io/evolu/';

const DEFAULT_SUITE_SYNC_RELAY_URL_PROD_ONION =
    urlToOnion(DEFAULT_SUITE_SYNC_RELAY_URL_PROD, TOR_URLS) ?? DEFAULT_SUITE_SYNC_RELAY_URL_PROD;

const SUITE_SYNC_RELAY_URL: SuiteSyncRelayUrlMap = {
    local: {
        clearnet: LOCAL_SUITE_SYNC_RELAY_URL,
        onion: LOCAL_SUITE_SYNC_RELAY_URL,
    },
    dev: {
        clearnet: DEFAULT_SUITE_SYNC_RELAY_URL_DEV,
        onion: DEFAULT_SUITE_SYNC_RELAY_URL_DEV_ONION,
    },
    prod: {
        clearnet: DEFAULT_SUITE_SYNC_RELAY_URL_PROD,
        onion: DEFAULT_SUITE_SYNC_RELAY_URL_PROD_ONION,
    },
};

const getTorVariant = (isTorEnabled: boolean): TorVariant => (isTorEnabled ? 'onion' : 'clearnet');

export const getSuiteSyncRelayUrl = ({ env, isTorEnabled }: GetSuiteSyncRelayUrlParams): string =>
    SUITE_SYNC_RELAY_URL[env][getTorVariant(isTorEnabled)];

const getSuiteSyncRelayUrlEnvironment = (): Environment => (isCodesignBuild() ? 'prod' : 'dev');

export const getSuiteSyncDefaultRelayUrl = ({ isTorEnabled }: { isTorEnabled: boolean }): string =>
    getSuiteSyncRelayUrl({
        env: getSuiteSyncRelayUrlEnvironment(),
        isTorEnabled,
    });

export const getSuiteSyncTrezorRelayUrls = (): string[] =>
    typedObjectValues({
        dev: SUITE_SYNC_RELAY_URL.dev,
        prod: SUITE_SYNC_RELAY_URL.prod,
    }).flatMap(urlsByTor => typedObjectValues(urlsByTor));

export const selectSuiteSyncCustomRelayUrl = (state: WithSuiteSyncState): string | null => {
    const { suiteSyncRelayUrl } = state.suiteSync.settings;

    return isNotNull(suiteSyncRelayUrl) && suiteSyncRelayUrl.trim() !== ''
        ? suiteSyncRelayUrl
        : null;
};

export const selectSuiteSyncRelayUrl = (state: WithSuiteSyncState, isTorEnabled: boolean): string =>
    selectSuiteSyncCustomRelayUrl(state) ?? getSuiteSyncDefaultRelayUrl({ isTorEnabled });
