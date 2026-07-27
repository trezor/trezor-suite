import type { CardanoAddress, CardanoGetAddress } from './common';
import type { BundledParams, Params, Response } from '../../params';

export declare function cardanoGetAddress(
    params: Params<CardanoGetAddress>,
): Response<CardanoAddress>;
export declare function cardanoGetAddress(
    params: BundledParams<CardanoGetAddress>,
): Response<CardanoAddress[]>;
