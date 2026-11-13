import { type DeviceIdentity, type GetTrezorConnectDep } from '@trezor/connect-common';
import {
    type SignError,
    type SignedMessage,
    toSignVerifyDeviceError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';

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
) => Promise<Result<SignedMessage, SignError>>;

export type SignEthereumMessageDep = {
    signEthereumMessage: SignEthereumMessage;
};

export const createSignEthereumMessage =
    (deps: SignEthereumMessageDeps): SignEthereumMessage =>
    async ({ device, path, message, hex }) => {
        const response = await deps.getTrezorConnect().ethereumSignMessage({
            device,
            path,
            message,
            hex,
        });

        return response.success
            ? ok(response.payload)
            : err(toSignVerifyDeviceError(response.error));
    };

export const injectSignEthereumMessage = (services: any): SignEthereumMessageDep => ({
    signEthereumMessage: services.signEthereumMessage,
});
