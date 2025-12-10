import { CreateSuiteStorage, SuiteSyncStorage } from '@suite-common/suite-sync-storage';

import { CreateJazzInstanceDep, JazzInstance } from './createJazzInstance';
import { AccountLabels } from './labeling/accountLabels';
import { AddressLabels } from './labeling/addressLabels';
import { OutputLabels } from './labeling/outputLabels';
import { WalletLabels } from './labeling/walletLabels';

export type CreateJazzStorageFactoryDeps = CreateJazzInstanceDep;

/**
 * Factory to create SuiteSyncStorage using Jazz.
 * This is the main integration point between Suite Sync and Jazz.
 */
export const createJazzStorageFactory =
    (deps: CreateJazzStorageFactoryDeps): CreateSuiteStorage =>
    ({ suiteSyncOwner, relayUrl }): SuiteSyncStorage => {
        // Shared Jazz instance for all label stores
        let jazzInstancePromise: Promise<JazzInstance> | null = null;
        let currentRelayUrl = relayUrl;

        const getJazzInstance = (): Promise<JazzInstance> => {
            if (!jazzInstancePromise) {
                jazzInstancePromise = deps.createJazzInstance({
                    suiteSyncOwner,
                    syncUrl: currentRelayUrl,
                });
            }

            return jazzInstancePromise;
        };

        // Create label stores - they'll share the same Jazz instance
        const accountLabels = new AccountLabels(getJazzInstance);
        const walletLabels = new WalletLabels(getJazzInstance);
        const addressLabels = new AddressLabels(getJazzInstance);
        const outputLabels = new OutputLabels(getJazzInstance);

        return {
            accountLabels,
            walletLabels,
            outputLabels,
            addressLabels,

            isReady: async () => {
                // Wait for the Jazz instance to be fully initialized
                // This ensures ensureLoaded has been called and the account root is ready
                await getJazzInstance();
            },

            updateRelayUrl: async (url: string) => {
                // When relay URL changes, we need to dispose current instance and create new one
                if (jazzInstancePromise) {
                    const instance = await jazzInstancePromise;
                    instance.done();
                }
                currentRelayUrl = url;
                jazzInstancePromise = null;

                // Reconnect with new URL
                await getJazzInstance();
            },

            dispose: async () => {
                if (jazzInstancePromise) {
                    const instance = await jazzInstancePromise;
                    instance.done();
                    jazzInstancePromise = null;
                }
            },
        };
    };
