/**
 * Performs device setup and generates a new seed.
 */

import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface ResetDevice {
    // TODO: unify
    display_random?: boolean;
    strength?: number;
    passphrase_protection?: boolean;
    pin_protection?: boolean;
    language?: string;
    label?: string;
    u2f_counter?: number;
    skip_backup?: boolean;
    no_backup?: boolean;
    backup_type?: 0 | 1;
}

export declare function resetDevice(params: Params<ResetDevice>): Response<Messages.Success>;
