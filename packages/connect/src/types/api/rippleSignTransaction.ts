import type { Params, Response } from '../params';
import type { RippleSignTransaction, RippleSignedTx } from './ripple';

export declare function rippleSignTransaction(
    params: Params<RippleSignTransaction>,
): Response<RippleSignedTx>;
