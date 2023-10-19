/**
 * Reboots device (currently only T1B1 with fw >= 1.10.0) in bootloader mode
 */

import type { PROTO } from '../../constants';
import type { CommonParams, Response } from '../params';

export declare function rebootToBootloader(params?: CommonParams): Response<PROTO.Success>;
