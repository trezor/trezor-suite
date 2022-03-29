/**
 * Reboots device (currently only T1 with fw >= 1.10.0) in bootloader mode
 */

import type { Messages } from '@trezor/transport';
import type { CommonParams, Response } from '../params';

export declare function rebootToBootloader(params?: CommonParams): Response<Messages.Success>;
