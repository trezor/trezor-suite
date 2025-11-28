import type { NetworkSymbol } from '@suite-common/wallet-config';

export type OutputLabel = {
    txId: string;
    outputIndex: number;
    label: string | null;
    accountDescriptor: string;
    networkSymbol: NetworkSymbol;
};

export type OutputLabelsStore = {
    update({ txId, outputIndex, label }: OutputLabel): void;
    subscribe(onChange: (payload: OutputLabel) => void): () => void;
};
