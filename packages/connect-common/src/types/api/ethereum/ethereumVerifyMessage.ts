import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { EthereumVerifyMessage } from './common';
import type { Params, Response } from '../../params';

export declare function ethereumVerifyMessage(
    params: Params<EthereumVerifyMessage>,
): Response<PROTO.Success>;
