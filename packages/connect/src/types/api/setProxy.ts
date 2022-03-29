/**
 * Set tor proxy for @trezor/blockchain-link connections
 */

import type { Messages } from '@trezor/transport';
import type { Response } from '../params';
import type { Proxy } from '../settings';

export type SetProxy = {
    proxy: Proxy;
    useOnionLinks?: boolean;
};

export declare function setProxy(params: SetProxy): Response<Messages.Success>;
