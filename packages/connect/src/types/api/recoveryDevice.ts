/**
 * Ask device to initiate recovery procedure
 */

import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface RecoveryDevice2 extends Omit<Messages.RecoveryDevice, 'word_count'> {
    word_count?: 12 | 18 | 24;
}

export declare function recoveryDevice(params: Params<RecoveryDevice2>): Response<Messages.Success>;
