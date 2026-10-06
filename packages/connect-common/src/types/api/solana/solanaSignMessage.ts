import type { SolanaSignMessage, SolanaSignedMessage } from './common';
import type { Params, Response } from '../../params';

export declare function solanaSignMessage(
    params: Params<SolanaSignMessage>,
): Response<SolanaSignedMessage>;
