import type { NetworkSymbol } from '@suite-common/wallet-config';

export type AddressLabel = {
    address: string;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type AddressLabelsStore = {
    update({ address, label }: AddressLabel): void;
    subscribe(onChange: (payload: AddressLabel) => void): () => void;
};
