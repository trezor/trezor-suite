import { type DeviceIdentity, type GetTrezorConnectDep } from '@trezor/connect-common';
import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import {
    type AccountType,
    type SignError,
    connectErrorToSignVerifyError,
} from '@trezor/network-module-suite-common-types';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '../cardanoAddressParameters';
import { type CardanoSignatureFormat, toCardanoSignatureFormat } from './cardanoSignatureFormats';

export type SignCardanoMessageDeps = GetTrezorConnectDep<'cardanoSignMessage'>;

export type SignCardanoMessageParams = {
    device: DeviceIdentity;
    symbol: CardanoNetworkSymbol;
    accountIndex: number;
    accountType: AccountType;
    /** The account's staking path signs with its stake address, any other path with its address. */
    path: string;
    message: string;
    hex: boolean;
    format?: string;
};

export type CardanoSignedMessage = {
    signature: string;
    pubKey: string;
    address: string;
};

export type SignCardanoMessage = (
    params: SignCardanoMessageParams,
) => Promise<Result<CardanoSignedMessage, SignError>>;

export type SignCardanoMessageDep = {
    signCardanoMessage: SignCardanoMessage;
};

const getCardanoAddressParameters = (accountIndex: number, path: string) => {
    const stakingPath = getStakingPath({ index: accountIndex });

    return path === stakingPath
        ? { addressType: PROTO.CardanoAddressType.REWARD, stakingPath }
        : getAddressParameters({ index: accountIndex }, path);
};

const getPublicKey = (
    format: CardanoSignatureFormat,
    keys: { pubKey: string; coseKey: string },
): string => {
    switch (format) {
        case 'raw':
            return keys.pubKey;
        case 'cose':
            return keys.coseKey;
        default:
            return exhaustive(format);
    }
};

export const createSignCardanoMessage =
    (deps: SignCardanoMessageDeps): SignCardanoMessage =>
    async ({ device, symbol, accountIndex, accountType, path, message, hex, format }) => {
        const signatureFormat = toCardanoSignatureFormat(format);

        if (!signatureFormat.success) {
            return signatureFormat;
        }

        const response = await deps.getTrezorConnect().cardanoSignMessage({
            device,
            path,
            payload: hex ? message : Buffer.from(message, 'utf8').toString('hex'),
            addressParameters: getCardanoAddressParameters(accountIndex, path),
            protocolMagic: getProtocolMagic(symbol),
            networkId: getNetworkId(),
            derivationType: getDerivationType(accountType),
        });

        return response.success
            ? ok({
                  signature: response.payload.coseSignature,
                  pubKey: getPublicKey(signatureFormat.payload, response.payload),
                  address: response.payload.headers.protected.address,
              })
            : err(connectErrorToSignVerifyError(response.error));
    };

export const injectSignCardanoMessage = (services: any): SignCardanoMessageDep => ({
    signCardanoMessage: services.signCardanoMessage,
});
