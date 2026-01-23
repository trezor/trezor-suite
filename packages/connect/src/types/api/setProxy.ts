/**
 * Set tor proxy for @trezor/blockchain-link connections
 */

import type { Proxy } from '@trezor/connect-common/src/types';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { CommonParams, Response } from '../params';

export type SetProxy = {
    proxy: Proxy;
};

export declare function setProxy(params: CommonParams & SetProxy): Response<PROTO.Success>;
