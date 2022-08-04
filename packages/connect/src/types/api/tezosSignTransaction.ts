import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { TezosSignTransaction } from './tezos';

export declare function tezosSignTransaction(
    params: Params<TezosSignTransaction>,
): Response<PROTO.TezosSignedTx>;
