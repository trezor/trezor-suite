import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';
import type { EthereumVerifyMessage } from './ethereum';

export declare function ethereumVerifyMessage(
    params: Params<EthereumVerifyMessage>,
): Response<PROTO.Success>;
