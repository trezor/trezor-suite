import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface EthereumSignMessage {
    path: string | number[];
    message: string;
    hex?: boolean;
}

export declare function ethereumSignMessage(
    params: Params<EthereumSignMessage>,
): Response<Messages.MessageSignature>;
