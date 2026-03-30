/**
 * Show a "Do not disconnect" dialog instead of the standard homescreen.
 */

import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function setBusy(params: Params<PROTO.SetBusy>): Response<PROTO.Success>;
