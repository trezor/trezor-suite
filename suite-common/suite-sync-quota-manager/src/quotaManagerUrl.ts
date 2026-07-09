import { isCodesignBuild } from '@trezor/env-utils';
import { TOR_URLS } from '@trezor/urls';
import { isNotNull, urlToOnion } from '@trezor/utils';

import { type WithSuiteSyncQuotaManagerState } from './quotaManagerSelectors';

type Environment = 'dev' | 'local' | 'prod';

type TorVariant = 'clearnet' | 'onion';

type QuotaManagerUrlMap = Record<Environment, Record<TorVariant, string>>;

const LOCAL_QUOTA_MANAGER_URL = 'http://127.0.0.1:4001/';

const DEV_QUOTA_MANAGER_URL = 'https://suite-sync-dev.suite.sldev.cz/quota-manager/';

const DEV_QUOTA_MANAGER_URL_ONION =
    urlToOnion(DEV_QUOTA_MANAGER_URL, TOR_URLS) ?? DEV_QUOTA_MANAGER_URL;

const PRODUCTION_QUOTA_MANAGER_URL = 'https://suite-sync.trezor.io/quota-manager/';

const PRODUCTION_QUOTA_MANAGER_URL_ONION =
    urlToOnion(PRODUCTION_QUOTA_MANAGER_URL, TOR_URLS) ?? PRODUCTION_QUOTA_MANAGER_URL;

const QUOTA_MANAGER_URL: QuotaManagerUrlMap = {
    dev: {
        clearnet: DEV_QUOTA_MANAGER_URL,
        onion: DEV_QUOTA_MANAGER_URL_ONION,
    },
    local: {
        clearnet: LOCAL_QUOTA_MANAGER_URL,
        onion: LOCAL_QUOTA_MANAGER_URL,
    },
    prod: {
        clearnet: PRODUCTION_QUOTA_MANAGER_URL,
        onion: PRODUCTION_QUOTA_MANAGER_URL_ONION,
    },
};

export type GetQuotaManagerUrl = () => string;

export type GetQuotaManagerUrlDep = {
    getQuotaManagerUrl: GetQuotaManagerUrl;
};

const getQuotaManagerUrlEnvironment = (): Environment => (isCodesignBuild() ? 'prod' : 'dev');

type GetQuotaManagerUrlParams = {
    env: Environment;
    isTorEnabled: boolean;
};

const getTorVariant = (isTorEnabled: boolean): TorVariant => (isTorEnabled ? 'onion' : 'clearnet');

export const getQuotaManagerUrl = ({ env, isTorEnabled }: GetQuotaManagerUrlParams) =>
    QUOTA_MANAGER_URL[env][getTorVariant(isTorEnabled)];

export const getQuotaManagerDefaultUrl = ({ isTorEnabled }: { isTorEnabled: boolean }) =>
    getQuotaManagerUrl({ env: getQuotaManagerUrlEnvironment(), isTorEnabled });

export const selectQuotaManagerCustomUrl = (state: WithSuiteSyncQuotaManagerState) => {
    const { baseUrl } = state.suiteSyncQuotaManager;

    return isNotNull(baseUrl) && baseUrl.trim() !== '' ? baseUrl : null;
};

export const selectQuotaManagerUrl = (
    state: WithSuiteSyncQuotaManagerState,
    isTorEnabled: boolean,
) => selectQuotaManagerCustomUrl(state) ?? getQuotaManagerDefaultUrl({ isTorEnabled });
