import { type DeviceIdentity, type GetTrezorConnectDep } from '@trezor/connect-common';
import {
    type VerifyError,
    toSignVerifyDeviceError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';

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
) => Promise<Result<void, VerifyError>>;

export type VerifyEthereumMessageDep = {
    verifyEthereumMessage: VerifyEthereumMessage;
};

export const createVerifyEthereumMessage =
    (deps: VerifyEthereumMessageDeps): VerifyEthereumMessage =>
    async ({ device, address, message, signature, hex }) => {
        const response = await deps.getTrezorConnect().ethereumVerifyMessage({
            device,
            address,
            message,
            signature,
            hex,
        });

        return response.success ? ok() : err(toSignVerifyDeviceError(response.error));
    };

export const injectVerifyEthereumMessage = (services: any): VerifyEthereumMessageDep => ({
    verifyEthereumMessage: services.verifyEthereumMessage,
});
