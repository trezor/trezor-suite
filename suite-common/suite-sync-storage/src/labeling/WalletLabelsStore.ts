import { WalletDescriptor } from '@suite-common/wallet-types';

export type WalletLabel = {
    walletDescriptor: WalletDescriptor;
    label: string | null;
};

export type WalletLabelsStore = {
    update({ walletDescriptor, label }: WalletLabel): void;
    subscribe(onChange: (payload: WalletLabel) => void): () => void;
};
