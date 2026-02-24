/**
 * Performs device setup and generates a new seed.
 */

import { PROTO } from '../../constants';
import type { XPubHashesPerBip43Path } from '../device';
import type { Params, Response } from '../params';

export declare function resetDevice(
    params: Params<PROTO.ResetDevice>,
): Response<PROTO.Success & { xpubHashes?: XPubHashesPerBip43Path }>;
