import {
    type DeviceIdentity,
    type GetTrezorConnectDep,
    type TrezorConnectCallable,
} from '@trezor/connect-common';

export type SignEthereumMessageDeps = GetTrezorConnectDep<'ethereumSignMessage'>;

export type SignEthereumMessageParams = {
    device: DeviceIdentity;
    /** An Ethereum account has a single address: the path of the account itself. */
    path: string;
    message: string;
    hex: boolean;
};

export type SignEthereumMessage = (
    params: SignEthereumMessageParams,
) => ReturnType<TrezorConnectCallable['ethereumSignMessage']>;

export type SignEthereumMessageDep = {
    signEthereumMessage: SignEthereumMessage;
};

export const createSignEthereumMessage =
    (deps: SignEthereumMessageDeps): SignEthereumMessage =>
    ({ device, path, message, hex }) =>
        deps.getTrezorConnect().ethereumSignMessage({ device, path, message, hex });

export const injectSignEthereumMessage = (services: any): SignEthereumMessageDep => ({
    signEthereumMessage: services.signEthereumMessage,
});
