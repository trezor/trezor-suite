import type { Params, Response } from '../../params';
import type { SignTransaction } from '../bitcoin/common';
import type { PrecomposeResultFinal } from '../bitcoin/composeTransaction';

export declare function precomposeSignTransaction(
    params: Params<SignTransaction>,
): Response<PrecomposeResultFinal>;
