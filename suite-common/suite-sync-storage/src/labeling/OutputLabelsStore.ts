export type OutputLabel = {
    txId: string;
    outputIndex: number;
    label: string | null;
};

export type OutputLabelsStore = {
    update({ txId, outputIndex, label }: OutputLabel): void;
    subscribe(onChange: (payload: OutputLabel) => void): () => void;
};
