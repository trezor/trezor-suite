/* eslint-disable import/no-extraneous-dependencies -- build-time tooling belongs in devDependencies */
import { serwist } from '@serwist/vite';
import path from 'path';
import type { Plugin, PluginOption } from 'vite';

import {
    MANIFEST_PLACEHOLDER,
    MAXIMUM_PRECACHED_FILE_SIZE,
    SERVICE_WORKER_FILE_NAME,
    getWorkerUrlWithoutQuery,
    precacheGlobIgnores,
    selectPrecachedEntries,
    serviceWorkerSource,
} from '@suite/service-worker/bundler';

type CreateServiceWorkerVitePluginsParams = {
    /** Directory the worker is written to. In dev it is written and deleted on every request. */
    outDir: string;
};

/**
 * The worker still reads the query from its own URL.
 * Listed before Serwist's plugins, so this middleware runs before Serwist's.
 */
const workerUrlQueryPlugin: Plugin = {
    name: 'suite-service-worker-url-query',
    apply: 'serve',
    configureServer: server => {
        server.middlewares.use((request, _response, next) => {
            const urlWithoutQuery = getWorkerUrlWithoutQuery(request.url);

            if (urlWithoutQuery !== undefined) {
                request.url = urlWithoutQuery;
            }

            next();
        });
    },
};

export const createServiceWorkerVitePlugins = ({
    outDir,
}: CreateServiceWorkerVitePluginsParams): PluginOption[] => [
    workerUrlQueryPlugin,
    ...serwist({
        swSrc: serviceWorkerSource,
        swDest: path.join(outDir, SERVICE_WORKER_FILE_NAME),
        globDirectory: outDir,
        // Every file is a candidate, as in webpack: the default takes only JS, CSS and HTML.
        globPatterns: ['**/*'],
        globIgnores: precacheGlobIgnores,
        manifestTransforms: [selectPrecachedEntries],
        injectionPoint: MANIFEST_PLACEHOLDER,
        maximumFileSizeToCacheInBytes: MAXIMUM_PRECACHED_FILE_SIZE,
        rollupFormat: 'es',
    }),
];
