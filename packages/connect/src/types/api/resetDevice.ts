/**
 * Performs device setup and generates a new seed.
 */

import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function resetDevice(params: Params<PROTO.ResetDevice>): Response<PROTO.Success>;
