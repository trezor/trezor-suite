import type { PROTO } from '../../constants';
import type { Params, BundledParams, Response } from '../params';

export interface CardanoCertificatePointer {
    blockIndex: number;
    txIndex: number;
    certificateIndex: number;
}

export interface CardanoAddressParameters {
    addressType: PROTO.CardanoAddressType;
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
    showOnTrezor?: boolean;
    derivationType?: PROTO.CardanoDerivationType;
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
): Response<CardanoAddress[]>;
