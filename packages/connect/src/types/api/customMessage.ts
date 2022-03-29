/**
 * Developers mode
 */

import type { Params, Response } from '../params';

export interface CustomMessage {
    messages?: JSON | object;
    message: string;
    params: JSON | object;
    callback: (request: any) => Promise<{ message: string; params?: object }>;
}

export declare function customMessage<R = any>(params: Params<CustomMessage>): Response<R>;
