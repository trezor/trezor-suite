import { z } from 'zod';

import { createHttpClient } from '@suite-common/http-client';
import type { Logger } from '@trezor/logger';

import { ICONS_URL_BASE } from '../../src/coinImages';
import { YIELD_VAULTS_URL } from '../constants';
import { type YieldVaults, yieldVaultsSchema } from '../schemas';

export type IconsLoggerDep = { logger: Logger };

export type FetchYieldVaults = () => Promise<YieldVaults>;

export type FetchYieldVaultsDep = { fetchYieldVaults: FetchYieldVaults };

export type FetchPublishedIcon = (fileName: string) => Promise<ArrayBuffer>;

export type FetchPublishedIconDep = { fetchPublishedIcon: FetchPublishedIcon };

export type VaultIconsClientDeps = IconsLoggerDep;

export type VaultIconsClient = FetchYieldVaultsDep & FetchPublishedIconDep;

export const createVaultIconsClient = (deps: VaultIconsClientDeps): VaultIconsClient => {
    const earnYieldApi = createHttpClient({
        onError: error => {
            deps.logger.error('Vault icons: error fetching yield vaults:', error);
        },
    });
    const fetchYieldVaults = earnYieldApi(YIELD_VAULTS_URL, {
        method: 'GET',
        schema: yieldVaultsSchema,
    });

    // The downloader reports missing renditions, so this client avoids logging them twice.
    const iconsCdnApi = createHttpClient({});
    const fetchPublishedIcon: FetchPublishedIcon = fileName =>
        iconsCdnApi(`${ICONS_URL_BASE}/${fileName}`, {
            method: 'GET',
            parseResponse: response => response.arrayBuffer(),
            schema: z.instanceof(ArrayBuffer),
            // Retry transient CDN failures so an icon is not skipped until the next nightly run.
            retry: {
                attempts: 2,
                delay: 1000,
                when: ({ response }) => (response?.status ?? 0) >= 500,
            },
        })();

    return { fetchYieldVaults, fetchPublishedIcon };
};
