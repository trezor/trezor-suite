import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { TezosSignTransaction } from './common';
import type { Params, Response } from '../../params';

export declare function tezosSignTransaction(
    params: Params<TezosSignTransaction>,
): Response<PROTO.TezosSignedTx>;
