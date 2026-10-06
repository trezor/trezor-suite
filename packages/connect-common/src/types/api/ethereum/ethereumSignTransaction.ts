import type { EthereumSignTransaction, EthereumSignedTx } from './common';
import type { ExperimentalMethod, Params, Response } from '../../params';

export declare function ethereumSignTransaction(
    // `__experimental` is optional; it is required at runtime only for EIP-7702 (`authorizationList`).
    params: Params<EthereumSignTransaction & Partial<ExperimentalMethod>>,
): Response<EthereumSignedTx>;
