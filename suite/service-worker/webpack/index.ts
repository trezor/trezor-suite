/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
import type { WebpackPluginInstance } from 'webpack';

import {
    MAXIMUM_PRECACHED_FILE_SIZE,
    SERVICE_WORKER_FILE_NAME,
    precacheExcludePatterns,
    selectPrecachedEntries,
    serviceWorkerSource,
} from '@suite/service-worker/bundler';

type CreateServiceWorkerWebpackPluginsParams = { isDev: boolean };

/**
 * `@serwist/webpack-plugin` is ESM-only and webpack configs load as CommonJS,
 * so the plugin comes from a dynamic import and this factory is async.
 */
export const createServiceWorkerWebpackPlugins = async ({
    isDev,
}: CreateServiceWorkerWebpackPluginsParams): Promise<WebpackPluginInstance[]> => {
    const { InjectManifest } = await import('@serwist/webpack-plugin');

    return [
        new InjectManifest({
            swSrc: serviceWorkerSource,
            swDest: SERVICE_WORKER_FILE_NAME,
            // Dev builds get a worker without a precache manifest.
            disablePrecacheManifest: isDev,
            exclude: precacheExcludePatterns,
            manifestTransforms: [selectPrecachedEntries],
            maximumFileSizeToCacheInBytes: MAXIMUM_PRECACHED_FILE_SIZE,
        }),
    ];
};
