import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';
import type { EthereumSignMessage } from './ethereum';

export declare function ethereumSignMessage(
    params: Params<EthereumSignMessage>,
): Response<PROTO.MessageSignature>;
