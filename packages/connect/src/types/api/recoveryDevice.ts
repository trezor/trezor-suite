/**
 * Ask device to initiate recovery procedure
 */

import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export interface RecoveryDevice extends Omit<PROTO.RecoveryDevice, 'word_count'> {
    word_count?: 12 | 18 | 24;
}

export declare function recoveryDevice(params: Params<RecoveryDevice>): Response<PROTO.Success>;
