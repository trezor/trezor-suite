import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export declare function applySettings(
    params: Params<Messages.ApplySettings>,
): Response<Messages.Success>;
