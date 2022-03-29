import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export interface EthereumVerifyMessage {
    address: string;
    message: string;
    hex?: boolean;
    signature: string;
}

export declare function ethereumVerifyMessage(
    params: Params<EthereumVerifyMessage>,
): Response<PROTO.Success>;
