import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';
import type { TezosSignTransaction } from './tezos';

export declare function tezosSignTransaction(
    params: Params<TezosSignTransaction>,
): Response<PROTO.TezosSignedTx>;
