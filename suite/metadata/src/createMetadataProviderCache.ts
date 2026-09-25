import { type DataType } from '@suite-common/metadata-types';
import { typedObjectKeys } from '@trezor/utils';

import { type FetchIntervalTrackingId } from './metadataUtils';
import { type DropboxProvider } from './providers/DropboxProvider';
import { type FileSystemProvider } from './providers/FileSystemProvider';
import { type GoogleProvider } from './providers/GoogleProvider';
import { type InMemoryTestProvider } from './providers/InMemoryTestProvider';

export type ProviderInstance =
    DropboxProvider | GoogleProvider | FileSystemProvider | InMemoryTestProvider;

/**
 * Provider instances and their polling timers cannot live in Redux because class instances do not
 * serialize. They belong to the composition root rather than to module scope, so a provider built
 * from one root's injected dependencies is never handed to another root.
 */
export type MetadataProviderCache = {
    instances: Record<DataType, ProviderInstance | undefined>;
    fetchIntervals: Partial<Record<FetchIntervalTrackingId, ReturnType<typeof setInterval>>>;
    /** Clears every polling timer and drops every cached provider. */
    dispose: () => void;
};

export type MetadataProviderCacheDep = { metadataProviderCache: MetadataProviderCache };

export const injectMetadataProviderCache = (services: any): MetadataProviderCacheDep => ({
    metadataProviderCache: services.metadataProviderCache,
});

export const createMetadataProviderCache = (): MetadataProviderCache => {
    const instances: MetadataProviderCache['instances'] = {
        labels: undefined,
        passwords: undefined,
    };
    const fetchIntervals: MetadataProviderCache['fetchIntervals'] = {};

    return {
        instances,
        fetchIntervals,
        dispose: () => {
            for (const id of typedObjectKeys(fetchIntervals)) {
                clearInterval(fetchIntervals[id]);
                delete fetchIntervals[id];
            }
            instances.labels = undefined;
            instances.passwords = undefined;
        },
    };
};
