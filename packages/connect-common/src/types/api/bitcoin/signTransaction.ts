/**
 * Bitcoin and Bitcoin-like
 * Asks device to sign given inputs and outputs of pre-composed transaction.
 * User is asked to confirm all transaction details on Trezor.
 */

import type { SignTransaction, SignedTransaction } from './common';
import type { Params, Response } from '../../params';

export declare function signTransaction(
    params: Params<SignTransaction>,
): Response<SignedTransaction>;
