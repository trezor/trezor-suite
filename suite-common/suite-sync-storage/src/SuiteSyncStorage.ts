import { AccountLabelsStore } from './labeling/AccountLabelsStore';
import { AddressLabelsStore } from './labeling/AddressLabelsStore';
import { OutputLabelsStore } from './labeling/OutputLabelsStore';
import { WalletLabelsStore } from './labeling/WalletLabelsStore';

export interface SuiteSyncStorage {
    accountLabels: AccountLabelsStore;
    walletLabels: WalletLabelsStore;
    outputLabels: OutputLabelsStore;
    addressLabels: AddressLabelsStore;

    updateRelayUrl(url: string): Promise<void>;
    dispose(): Promise<void>;
}
