import type { RippleSignTransaction, RippleSignedTx } from './common';
import type { Params, Response } from '../../params';

export declare function rippleSignTransaction(
    params: Params<RippleSignTransaction>,
): Response<RippleSignedTx>;
