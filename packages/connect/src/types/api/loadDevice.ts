/**
 * Performs device setup and generates a new seed.
 */

import { PROTO } from '../../constants';
import type { Params, Response } from '../params';

export declare function loadDevice(params: Params<PROTO.LoadDevice>): Response<PROTO.Success>;
