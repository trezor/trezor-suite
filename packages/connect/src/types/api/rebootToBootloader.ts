/**
 * Reboots device (currently only T1B1 with fw >= 1.10.0) in bootloader mode
 */

import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function rebootToBootloader(
    params?: Params<PROTO.RebootToBootloader>,
): Response<PROTO.Success>;
