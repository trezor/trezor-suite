/**
 * Bitcoin and Bitcoin-like
 * Asks device to sign a message using the private key derived by given BIP32
 * path.
 */

import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface SignMessage {
    path: string | number[];
    coin: string;
    message: string;
    hex?: boolean;
    no_script_type?: boolean;
}

export declare function signMessage(
    params: Params<SignMessage>,
): Response<Messages.MessageSignature>;
