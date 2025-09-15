import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';
import type { NEMSignTransaction } from './nem';

export declare function nemSignTransaction(
    params: Params<NEMSignTransaction>,
): Response<PROTO.NEMSignedTx>;
