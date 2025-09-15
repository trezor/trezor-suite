/**
 * Resets device to factory defaults and removes all private data.
 */

import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { CommonParams, Response } from '../params';

export declare function wipeDevice(params?: CommonParams): Response<PROTO.Success>;
