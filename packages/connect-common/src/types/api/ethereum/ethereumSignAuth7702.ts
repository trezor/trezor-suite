import type { EthereumSignAuth7702, EthereumSignedAuth7702 } from './common';
import type { ExperimentalMethod, Params, Response } from '../../params';

export declare function ethereumSignAuth7702(
    params: Params<EthereumSignAuth7702 & ExperimentalMethod>,
): Response<EthereumSignedAuth7702>;
