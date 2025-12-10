import type { LocalNode } from 'cojson';
import { AuthSecretStorage, KvStoreContext } from 'jazz-tools';
import { LocalStorageKVStore, createJazzBrowserContext } from 'jazz-tools/browser';

import { SuiteSyncAccount } from '@suite-common/suite-sync-jazz';
import { SuiteSyncOwner } from '@suite-common/suite-types';

export type JazzInstance = {
    account: SuiteSyncAccount;
    node: LocalNode;
    done: () => void;
    addConnectionListener: (listener: (connected: boolean) => void) => () => void;
};

export type CreateJazzInstance = (params: {
    suiteSyncOwner: SuiteSyncOwner;
    syncUrl: string;
}) => Promise<JazzInstance>;

/**
 * Creates a Jazz instance for browser/desktop environment.
 * Uses localStorage for KV storage and IndexedDB for persistent storage.
 *
 * The device owner secret is used as the secret seed to derive a deterministic
 * Jazz account, ensuring the same device always gets the same account.
 */
export const createJazzInstanceFactory =
    (): CreateJazzInstance =>
    async ({ suiteSyncOwner, syncUrl }): Promise<JazzInstance> => {
        // Create a unique storage key for this device
        const storageKey = `jazz-suite-sync-${suiteSyncOwner.ownerId}`;

        // Create KV store for auth secret storage (browser uses localStorage)
        const kvStore = new LocalStorageKVStore();

        // Initialize the KV store context (required for AuthSecretStorage)
        KvStoreContext.getInstance().initialize(kvStore);

        const authSecretStorage = new AuthSecretStorage(storageKey);

        // Validate sync URL format
        const validSyncUrl = (
            syncUrl.startsWith('ws://') || syncUrl.startsWith('wss://')
                ? syncUrl
                : `ws://${syncUrl}`
        ) as `ws://${string}` | `wss://${string}`;

        // Check if we have existing credentials in storage
        const existingCredentials = await authSecretStorage.get();

        // Create Jazz context with browser LocalNode
        // If credentials exist, use them; otherwise Jazz will create new ones
        const context = await createJazzBrowserContext({
            AccountSchema: SuiteSyncAccount,
            credentials: existingCredentials || undefined,
            sync: {
                peer: validSyncUrl,
                when: 'always',
            },
            authSecretStorage,
            // Configure storage - use IndexedDB for browser environment
            storage: 'indexedDB',
        });

        // Ensure the root is loaded
        await context.me.$jazz.ensureLoaded({
            resolve: {
                root: {
                    walletLabels: true,
                    accountLabels: true,
                    addressLabels: true,
                    outputLabels: true,
                },
            },
        });

        return {
            account: context.me,
            node: context.node,
            done: context.done,
            addConnectionListener: context.addConnectionListener,
        };
    };
