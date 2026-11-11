import type { Protocol } from '@trezor/network-module-suite-common-types';

export interface SendFormState {
    scheme: Protocol;
    address: string;
    amount?: string;
    label?: string;
    token?: string; // ERC-681: token contract address
    tokenAmount?: string; // ERC-681: amount in token's smallest unit (uint256)
}

type Autofill<T> = Partial<T> & {
    shouldFill?: boolean;
};

export interface ProtocolState {
    sendForm: Autofill<SendFormState>;
}
