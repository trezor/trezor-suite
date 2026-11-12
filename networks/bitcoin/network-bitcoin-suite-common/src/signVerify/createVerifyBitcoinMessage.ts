import {
    type DeviceIdentity,
    type GetTrezorConnectDep,
    type TrezorConnectCallable,
    asCoinSymbol,
} from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';

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
) => ReturnType<TrezorConnectCallable['verifyMessage']>;

export type VerifyBitcoinMessageDep = {
    verifyBitcoinMessage: VerifyBitcoinMessage;
};

export const createVerifyBitcoinMessage =
    (deps: VerifyBitcoinMessageDeps): VerifyBitcoinMessage =>
    ({ device, symbol, address, message, signature, hex }) =>
        deps.getTrezorConnect().verifyMessage({
            device,
            address,
            coin: asCoinSymbol(symbol),
            message,
            signature,
            hex,
        });

export const injectVerifyBitcoinMessage = (services: any): VerifyBitcoinMessageDep => ({
    verifyBitcoinMessage: services.verifyBitcoinMessage,
});
