import type { Messages } from '@trezor/transport';
import type { Params, BundledParams, Response, BundledResponse } from '../params';

export interface CardanoCertificatePointer {
    blockIndex: number;
    txIndex: number;
    certificateIndex: number;
}

export interface CardanoAddressParameters {
    addressType: Messages.CardanoAddressType;
    path?: string | number[];
    stakingPath?: string | number[];
    stakingKeyHash?: string;
    certificatePointer?: CardanoCertificatePointer;
    paymentScriptHash?: string;
    stakingScriptHash?: string;
}

export interface CardanoGetAddress {
    addressParameters: CardanoAddressParameters;
    protocolMagic: number;
    networkId: number;
    address?: string;
    useEventListener?: boolean; // this param is set automatically in factory
    showOnTrezor?: boolean;
    derivationType?: Messages.CardanoDerivationType;
}

export interface CardanoAddress {
    addressParameters: CardanoAddressParameters;
    protocolMagic: number;
    networkId: number;
    serializedPath: string;
    serializedStakingPath: string;
    address: string;
}

export declare function cardanoGetAddress(
    params: Params<CardanoGetAddress>,
): Response<CardanoAddress>;
export declare function cardanoGetAddress(
    params: BundledParams<CardanoGetAddress>,
): BundledResponse<CardanoAddress>;
