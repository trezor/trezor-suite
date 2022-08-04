/**
 * Bitcoin and Bitcoin-like
 * Asks device to sign a message using the private key derived by given BIP32
 * path.
 */

import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type { SignMessage } from './bitcoin';

export declare function signMessage(params: Params<SignMessage>): Response<PROTO.MessageSignature>;
