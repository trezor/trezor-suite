import {
    type DeviceIdentity,
    type GetTrezorConnectDep,
    type TrezorConnectCallable,
    asCoinSymbol,
} from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';

export type SignBitcoinMessageDeps = GetTrezorConnectDep<'signMessage'>;

export type SignBitcoinMessageParams = {
    device: DeviceIdentity;
    symbol: BitcoinNetworkSymbol;
    path: string;
    message: string;
    hex: boolean;
    /** Signs in the compatibility format, without the script type. */
    isElectrum: boolean;
};

export type SignBitcoinMessage = (
    params: SignBitcoinMessageParams,
) => ReturnType<TrezorConnectCallable['signMessage']>;

export type SignBitcoinMessageDep = {
    signBitcoinMessage: SignBitcoinMessage;
};

export const createSignBitcoinMessage =
    (deps: SignBitcoinMessageDeps): SignBitcoinMessage =>
    ({ device, symbol, path, message, hex, isElectrum }) =>
        deps.getTrezorConnect().signMessage({
            device,
            path,
            coin: asCoinSymbol(symbol),
            message,
            hex,
            no_script_type: isElectrum,
        });

export const injectSignBitcoinMessage = (services: any): SignBitcoinMessageDep => ({
    signBitcoinMessage: services.signBitcoinMessage,
});
