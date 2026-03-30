/**
 * Performs device setup and generates a new seed.
 */

import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function loadDevice(params: Params<PROTO.LoadDevice>): Response<PROTO.Success>;
