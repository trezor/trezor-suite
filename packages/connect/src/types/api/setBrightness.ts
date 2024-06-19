import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Params, Response } from '../params';

export declare function setBrightness(params: Params<PROTO.SetBrightness>): Response<PROTO.Success>;
