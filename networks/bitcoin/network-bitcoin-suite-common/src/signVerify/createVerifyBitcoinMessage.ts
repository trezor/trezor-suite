import {
    type DeviceIdentity,
    type GetTrezorConnectDep,
    asCoinSymbol,
} from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import {
    type VerifyError,
    toSignVerifyDeviceError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';

export type VerifyBitcoinMessageDeps = GetTrezorConnectDep<'verifyMessage'>;

export type VerifyBitcoinMessageParams = {
    device: DeviceIdentity;
    symbol: BitcoinNetworkSymbol;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export type VerifyBitcoinMessage = (
    params: VerifyBitcoinMessageParams,
) => Promise<Result<void, VerifyError>>;

export type VerifyBitcoinMessageDep = {
    verifyBitcoinMessage: VerifyBitcoinMessage;
};

export const createVerifyBitcoinMessage =
    (deps: VerifyBitcoinMessageDeps): VerifyBitcoinMessage =>
    async ({ device, symbol, address, message, signature, hex }) => {
        const response = await deps.getTrezorConnect().verifyMessage({
            device,
            address,
            coin: asCoinSymbol(symbol),
            message,
            signature,
            hex,
        });

        return response.success ? ok() : err(toSignVerifyDeviceError(response.error));
    };

export const injectVerifyBitcoinMessage = (services: any): VerifyBitcoinMessageDep => ({
    verifyBitcoinMessage: services.verifyBitcoinMessage,
});
