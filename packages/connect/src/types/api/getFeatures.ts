/**
 * Retrieves the set of features associated with the device.
 */
import type { CommonParams, Response } from '../params';
import type { Features } from '../device';

export declare function getFeatures(params?: CommonParams): Response<Features>;
