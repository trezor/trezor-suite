import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { EthereumVerifyMessage } from './ethereum';

export declare function ethereumVerifyMessage(
    params: Params<EthereumVerifyMessage>,
): Response<PROTO.Success>;
