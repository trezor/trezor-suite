/**
 * Bitcoin and Bitcoin-like
 * Asks device to verify a message using the signer address and signature.
 */

import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { VerifyMessage } from './bitcoin';

export declare function verifyMessage(params: Params<VerifyMessage>): Response<PROTO.Success>;
