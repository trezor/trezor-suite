import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';
import type { EosSignTransaction } from './eos';

export declare function eosSignTransaction(
    params: Params<EosSignTransaction>,
): Response<PROTO.EosSignedTx>;
