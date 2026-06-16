import type { EthereumSignTransaction, EthereumSignedTx } from './common';
import type { Params, Response } from '../../params';

export declare function ethereumSignTransaction(
    params: Params<EthereumSignTransaction>,
): Response<EthereumSignedTx>;
