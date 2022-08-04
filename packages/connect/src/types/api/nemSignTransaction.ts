import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { NEMSignTransaction } from './nem';

export declare function nemSignTransaction(
    params: Params<NEMSignTransaction>,
): Response<PROTO.NEMSignedTx>;
