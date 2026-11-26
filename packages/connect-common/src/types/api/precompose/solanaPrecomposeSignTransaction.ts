import type { Params, Response } from '../../params';
import type { PrecomposeResultFinal } from '../bitcoin/composeTransaction';
import type { SolanaSignTransaction } from '../solana/common';

export declare function solanaPrecomposeSignTransaction(
    params: Params<SolanaSignTransaction>,
): Response<PrecomposeResultFinal>;
