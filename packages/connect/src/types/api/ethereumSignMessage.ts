import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { EthereumSignMessage } from './ethereum';

export declare function ethereumSignMessage(
    params: Params<EthereumSignMessage>,
): Response<PROTO.MessageSignature>;
