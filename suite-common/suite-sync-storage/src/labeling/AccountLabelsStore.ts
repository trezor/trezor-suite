import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';

export type AccountLabel = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    label: string | null;
};

export type AccountLabelsStore = {
    update({ networkSymbol, accountDescriptor, label }: AccountLabel): void;
    subscribe(onChange: (payload: AccountLabel) => void): () => void;
};
