/**
 * Request: Test if the device is alive, device sends back the message in Success response
 */

import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { Params, Response } from '../params';

export declare function pingDevice(params: Params<PROTO.Ping>): Response<PROTO.Ping>;
