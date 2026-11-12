import { type DeviceIdentity, type ERRORS, type GetTrezorConnectDep } from '@trezor/connect-common';
import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import type { AccountType } from '@trezor/network-module-suite-common-types';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Result } from '@trezor/type-utils';

import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '../cardanoAddressParameters';

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
    /** Returns the public key as a COSE key instead of a raw one. */
    isCose: boolean;
};

export type CardanoSignedMessage = {
    signature: string;
    pubKey: string;
    address: string;
};

export type SignCardanoMessage = (
    params: SignCardanoMessageParams,
) => Promise<Result<CardanoSignedMessage, ERRORS.SerializedError>>;

export type SignCardanoMessageDep = {
    signCardanoMessage: SignCardanoMessage;
};

const getCardanoAddressParameters = (accountIndex: number, path: string) => {
    const stakingPath = getStakingPath({ index: accountIndex });

    return path === stakingPath
        ? { addressType: PROTO.CardanoAddressType.REWARD, stakingPath }
        : getAddressParameters({ index: accountIndex }, path);
};

export const createSignCardanoMessage =
    (deps: SignCardanoMessageDeps): SignCardanoMessage =>
    async ({ device, symbol, accountIndex, accountType, path, message, hex, isCose }) => {
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
            ? {
                  ...response,
                  payload: {
                      signature: response.payload.coseSignature,
                      pubKey: isCose ? response.payload.coseKey : response.payload.pubKey,
                      address: response.payload.headers.protected.address,
                  },
              }
            : response;
    };

export const injectSignCardanoMessage = (services: any): SignCardanoMessageDep => ({
    signCardanoMessage: services.signCardanoMessage,
});
