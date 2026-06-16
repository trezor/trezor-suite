import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { EthereumSignMessage } from './common';
import type { Params, Response } from '../../params';

export declare function ethereumSignMessage(
    params: Params<EthereumSignMessage>,
): Response<PROTO.MessageSignature>;
