/**
 * Resets device to factory defaults and removes all private data.
 */

import type { PROTO } from '../../constants';
import type { CommonParams, Response } from '../params';

export declare function wipeDevice(params?: CommonParams): Response<PROTO.Success>;
