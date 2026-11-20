/**
 * Performs device setup and generates a new seed.
 */

import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../../params';

export declare function resetDevice(params: Params<PROTO.ResetDevice>): Response<PROTO.Success>;
