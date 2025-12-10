import { AccountLabelsStore } from './labeling/AccountLabelsStore';
import { AddressLabelsStore } from './labeling/AddressLabelsStore';
import { OutputLabelsStore } from './labeling/OutputLabelsStore';
import { WalletLabelsStore } from './labeling/WalletLabelsStore';

/**
 * This is a **Stateful** service, that represents a Store for one Owner (for example Wallet).
 * Every wallet has its own Store. Store can use different technologies to provide Synchronization
 * of data. For example the Evolu library.
 */
export type SuiteSyncStorage = {
    accountLabels: AccountLabelsStore;
    walletLabels: WalletLabelsStore;
    outputLabels: OutputLabelsStore;
    addressLabels: AddressLabelsStore;

    /**
     * Returns a Promise that resolves when the storage is fully initialized and ready to use.
     * This ensures the Jazz instance is created and the account root is loaded.
     */
    isReady(): Promise<void>;
    updateRelayUrl(url: string): Promise<void>;
    dispose(): Promise<void>;
};
