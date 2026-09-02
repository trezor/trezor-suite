import type { ComposeParams, SignedTransaction } from './common';
import type { Params, Response } from '../../params';

type SendParams = ComposeParams & { push?: boolean; identity?: string };

export declare function sendTransaction(params: Params<SendParams>): Response<SignedTransaction>;
