import type { LocalNode } from 'cojson';
import { PureJSCrypto } from 'cojson/crypto/PureJSCrypto';
import { Account, AuthSecretStorage, ID, cojsonInternals } from 'jazz-tools';
import { ExpoSQLiteAdapter, ExpoSecureStoreAdapter } from 'jazz-tools/expo';
import { KvStoreContext, ReactNativeContextManager } from 'jazz-tools/react-native-core';

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
 * Creates a Jazz instance for React Native Expo environment.
 * Uses Expo SecureStore for KV storage and SQLite for persistent storage.
 *
 * The device owner secret is used as the secret seed to derive a deterministic
 * Jazz account, ensuring the same device always gets the same account.
 * Uses PassphraseAuth-style credential derivation from the suiteSyncOwner.ownerSecret.
 */
export const createJazzInstanceFactory =
    (): CreateJazzInstance =>
    async ({ suiteSyncOwner, syncUrl }): Promise<JazzInstance> => {
        const storageKey = `jazz-suite-sync-${suiteSyncOwner.ownerId}`;

        // Create KV store for auth secret storage (Expo uses SecureStore)
        const kvStore = new ExpoSecureStoreAdapter();

        // Initialize the KV store context (required for AuthSecretStorage)
        KvStoreContext.getInstance().initialize(kvStore);

        // Create auth secret storage to check for existing credentials
        const authSecretStorage = new AuthSecretStorage(storageKey);

        // Validate sync URL format
        const validSyncUrl = (
            syncUrl.startsWith('ws://') || syncUrl.startsWith('wss://')
                ? syncUrl
                : `ws://${syncUrl}`
        ) as `ws://${string}` | `wss://${string}`;

        // Use PureJSCrypto for credential derivation (platform-agnostic)
        // We use this instead of RNQuickCrypto because it's simpler for these operations
        // and avoids type compatibility issues
        const derivationCrypto = await PureJSCrypto.create();

        // Convert the hex-encoded owner secret to bytes (this is our secret seed)
        // The ownerSecret is a SLIP21-derived 32-byte secret from the Trezor device
        const secretSeed = hexToBytes(suiteSyncOwner.ownerSecret).slice(0, 32);

        // Derive the account secret from the seed (same as PassphraseAuth.logIn)
        const accountSecret = derivationCrypto.agentSecretFromSecretSeed(secretSeed);

        // Derive the account ID from the account secret
        const accountID = cojsonInternals.idforHeader(
            cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, derivationCrypto),
            derivationCrypto,
        ) as ID<Account>;

        // Create credentials using the derived values
        const credentials = {
            accountID,
            secretSeed,
            accountSecret,
            provider: 'passphrase' as const,
        };

        // Create SQLite adapter for persistent storage
        const sqliteAdapter = new ExpoSQLiteAdapter('jazz-suite-sync-storage');
        await sqliteAdapter.initialize();

        // Create Jazz context manager for React Native
        // The manager creates its own AuthSecretStorage internally with the provided key
        const contextManager = new ReactNativeContextManager<typeof SuiteSyncAccount>({
            authSecretStorageKey: storageKey,
        });

        // Get the Jazz context using the manager with the derived credentials
        const context = await contextManager.getNewContext(
            {
                AccountSchema: SuiteSyncAccount,
                guestMode: false, // Ensure we get an account context, not guest
                sync: {
                    peer: validSyncUrl,
                    when: 'always',
                },
                storage: sqliteAdapter,
                CryptoProvider: PureJSCrypto,
            },
            {
                credentials,
            },
        );

        // TypeScript guard: ensure we have an account context (not guest)
        if (!('me' in context)) {
            throw new Error('Failed to create Jazz account context');
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
