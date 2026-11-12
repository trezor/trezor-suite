import {
    type DeviceIdentity,
    type GetTrezorConnectDep,
    type TrezorConnectCallable,
} from '@trezor/connect-common';

export type VerifyEthereumMessageDeps = GetTrezorConnectDep<'ethereumVerifyMessage'>;

export type VerifyEthereumMessageParams = {
    device: DeviceIdentity;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export type VerifyEthereumMessage = (
    params: VerifyEthereumMessageParams,
) => ReturnType<TrezorConnectCallable['ethereumVerifyMessage']>;

export type VerifyEthereumMessageDep = {
    verifyEthereumMessage: VerifyEthereumMessage;
};

export const createVerifyEthereumMessage =
    (deps: VerifyEthereumMessageDeps): VerifyEthereumMessage =>
    ({ device, address, message, signature, hex }) =>
        deps.getTrezorConnect().ethereumVerifyMessage({ device, address, message, signature, hex });

export const injectVerifyEthereumMessage = (services: any): VerifyEthereumMessageDep => ({
    verifyEthereumMessage: services.verifyEthereumMessage,
});
