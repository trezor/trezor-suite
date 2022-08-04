import type { Params, BundledParams, Response } from '../params';
import type { CardanoAddress, CardanoGetAddress } from './cardano';

export declare function cardanoGetAddress(
    params: Params<CardanoGetAddress>,
): Response<CardanoAddress>;
export declare function cardanoGetAddress(
    params: BundledParams<CardanoGetAddress>,
): Response<CardanoAddress[]>;
