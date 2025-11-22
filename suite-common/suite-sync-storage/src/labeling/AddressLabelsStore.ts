export type AddressLabel = {
    address: string;
    label: string | null;
};

export interface AddressLabelsStore {
    update({ address, label }: AddressLabel): void;
    subscribe(onChange: (payload: AddressLabel) => void): () => void;
}
