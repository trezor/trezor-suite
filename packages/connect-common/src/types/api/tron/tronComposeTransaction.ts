import type { TronComposeTransaction, TronComposedTransaction } from './common';
import type { DeviceFreeParams, Response } from '../../params';

export declare function tronComposeTransaction(
    params: DeviceFreeParams<TronComposeTransaction>,
): Response<TronComposedTransaction>;
