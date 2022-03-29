/**
 * Change pin
 */

import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export declare function changePin(params: Params<Messages.ChangePin>): Response<Messages.Success>;
