/**
 * Set tor proxy for @trezor/blockchain-link connections
 */

import type { PROTO } from '../../constants';
import type { CommonParams, Response } from '../params';
import type { Proxy } from '../settings';

export type SetProxy = {
    proxy: Proxy;
};

export declare function setProxy(params: CommonParams & SetProxy): Response<PROTO.Success>;
