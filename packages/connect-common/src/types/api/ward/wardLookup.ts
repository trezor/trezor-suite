/**
 * WARD lookup (PULL): wardd sends WARDLookup with no proof, the device computes the entry_key
 * and pulls the proof (answered by wardd), and proves membership or non-membership against
 * its authenticated root. Returns the device's verdict and, for a proven member, the label
 * wardd stores for it. Connect only relays (see `wardd` in ConnectSettings).
 */

import type { WardVerifySchema } from './wardVerify';
import type { Params, Response } from '../../params';

export interface WardLookupResult {
    wardId: string;
    valid: boolean;
    isMember: boolean;
    counter: number;
    /** The stored label; only when the device proved membership. */
    metadata?: Record<string, unknown>;
}

export declare function wardLookup(params: Params<WardVerifySchema>): Response<WardLookupResult>;
