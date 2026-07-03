import { type DeferredManager, createDeferredManager } from '@trezor/utils';

/**
 * Message-promise managers across connect share the same id scheme: a random
 * UUID string. Centralizing the generator keeps that scheme in one place instead
 * of repeating the `generateId` lambda in every message channel.
 */
export const createUUIDDeferredManager = <T = any>(): DeferredManager<T, string> =>
    createDeferredManager<T, string>({ generateId: () => crypto.randomUUID() });
