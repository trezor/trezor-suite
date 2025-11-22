import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';

export type AccountLabel = {
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    label: string | null;
};

export interface AccountLabelsStore {
    update({ networkSymbol, accountDescriptor, label }: AccountLabel): void;
    subscribe(onChange: (payload: AccountLabel) => void): () => void;
}
