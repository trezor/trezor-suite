import type { Params, Response } from '../params';
import type { EthereumSignTransaction, EthereumSignedTx } from './ethereum';

export declare function ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
): Response<EthereumSignedTx>;
