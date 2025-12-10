import type { LocalNode } from 'cojson';
import { WasmCrypto } from 'cojson/crypto/WasmCrypto';
import { Account, AuthSecretStorage, ID, KvStoreContext, cojsonInternals } from 'jazz-tools';
import { LocalStorageKVStore, createJazzBrowserContext } from 'jazz-tools/browser';

import { SuiteSyncOwner } from '@suite-common/suite-types';

import { SuiteSyncAccount } from './schema';

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

export type CreateJazzInstanceDep = {
    createJazzInstance: CreateJazzInstance;
};

/**
 * Converts a hex string to a Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    return bytes;
}

/**
 * Creates a Jazz instance without React providers.
 * This directly creates a LocalNode and connects it to the sync server.
 *
 * The device owner secret is used as the secret seed to derive a deterministic
 * Jazz account, ensuring the same device always gets the same account.
 * Uses PassphraseAuth-style credential derivation from the suiteSyncOwner.ownerSecret.
 */
export const createJazzInstanceFactory =
    (): CreateJazzInstance =>
    async ({ suiteSyncOwner, syncUrl }): Promise<JazzInstance> => {
        // Create a unique storage key for this device
        const storageKey = `jazz-suite-sync-${suiteSyncOwner.ownerId}`;

        // Create KV store for auth secret storage (required for browser context)
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

        // Initialize crypto provider to derive credentials from the owner secret
        const crypto = await WasmCrypto.create();

        // Convert the hex-encoded owner secret to bytes (this is our secret seed)
        // The ownerSecret is a SLIP21-derived 32-byte secret from the Trezor device
        const secretSeed = hexToBytes(suiteSyncOwner.ownerSecret);

        // Derive the account secret from the seed (same as PassphraseAuth.logIn)
        const accountSecret = crypto.agentSecretFromSecretSeed(secretSeed);

        // Derive the account ID from the account secret
        const accountID = cojsonInternals.idforHeader(
            cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, crypto),
            crypto,
        ) as ID<Account>;

        // Create credentials using the derived values
        const credentials = {
            accountID,
            secretSeed,
            accountSecret,
            provider: 'passphrase' as const,
        };

        // Check if credentials already exist in storage with the same accountID
        // If they exist, the account was already created on this device
        const existingCredentials = await authSecretStorage.get();
        const isExistingAccount = existingCredentials?.accountID === accountID;

        let context;

        if (isExistingAccount) {
            // Account exists locally - load it with sync enabled
            context = await createJazzBrowserContext({
                AccountSchema: SuiteSyncAccount,
                credentials,
                sync: {
                    peer: validSyncUrl,
                    when: 'always',
                },
                authSecretStorage,
                crypto,
                storage: 'indexedDB',
            });
        } else {
            // New account - first create it locally without sync to avoid "Account unavailable from all peers" error
            // This creates the account in local storage using the deterministic credentials
            context = await createJazzBrowserContext({
                AccountSchema: SuiteSyncAccount,
                credentials,
                sync: {
                    peer: validSyncUrl,
                    // Start with sync disabled for new accounts to create locally first
                    when: 'never',
                },
                authSecretStorage,
                crypto,
                storage: 'indexedDB',
            });

            // Save credentials to storage so future sessions know the account exists
            await authSecretStorage.set(credentials);

            // Now dispose and recreate with sync enabled
            // This ensures the newly created account gets synced to the server
            context.done();

            context = await createJazzBrowserContext({
                AccountSchema: SuiteSyncAccount,
                credentials,
                sync: {
                    peer: validSyncUrl,
                    when: 'always',
                },
                authSecretStorage,
                crypto,
                storage: 'indexedDB',
            });
        }

        // Save the credentials to auth storage for future sessions
        await authSecretStorage.set(credentials);

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
