import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { EosSignTransaction } from './eos';

export declare function eosSignTransaction(
    params: Params<EosSignTransaction>,
): Response<PROTO.EosSignedTx>;
