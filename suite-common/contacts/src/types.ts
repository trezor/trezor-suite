export type Contact = {
    address: string;
    label: string;
    signature: string;
    deviceState: string;
    receiveAddresses: {
        address: string;
        signature: string;
    }[];
};
