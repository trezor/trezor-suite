import {
    type DeviceIdentity,
    type GetTrezorConnectDep,
    asCoinSymbol,
} from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import {
    type SignError,
    type SignedMessage,
    connectErrorToSignVerifyError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err, ok } from '@trezor/type-utils';

import { toBitcoinSignatureFormat } from './bitcoinSignatureFormats';

export type SignBitcoinMessageDeps = GetTrezorConnectDep<'signMessage'>;

export type SignBitcoinMessageParams = {
    device: DeviceIdentity;
    symbol: BitcoinNetworkSymbol;
    path: string;
    message: string;
    hex: boolean;
    format?: string;
};

export type SignBitcoinMessage = (
    params: SignBitcoinMessageParams,
) => Promise<Result<SignedMessage, SignError>>;

export type SignBitcoinMessageDep = {
    signBitcoinMessage: SignBitcoinMessage;
};

export const createSignBitcoinMessage =
    (deps: SignBitcoinMessageDeps): SignBitcoinMessage =>
    async ({ device, symbol, path, message, hex, format }) => {
        const signatureFormat = toBitcoinSignatureFormat(format);

        if (!signatureFormat.success) {
            return signatureFormat;
        }

        const response = await deps.getTrezorConnect().signMessage({
            device,
            path,
            coin: asCoinSymbol(symbol),
            message,
            hex,
            no_script_type: signatureFormat.payload === 'electrum',
        });

        return response.success
            ? ok(response.payload)
            : err(connectErrorToSignVerifyError(response.error));
    };

export const injectSignBitcoinMessage = (services: any): SignBitcoinMessageDep => ({
    signBitcoinMessage: services.signBitcoinMessage,
});
