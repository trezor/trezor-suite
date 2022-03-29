import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export declare function applyFlags(params: Params<Messages.ApplyFlags>): Response<Messages.Success>;
