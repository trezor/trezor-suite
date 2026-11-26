import type { Params, Response } from '../../params';
import type { PrecomposeResultFinal } from '../bitcoin/composeTransaction';
import type { EthereumSignTransaction } from '../ethereum/common';

export declare function ethereumPrecomposeSignTransaction(
    params: Params<EthereumSignTransaction>,
): Response<PrecomposeResultFinal>;
