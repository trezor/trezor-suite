import type { Params, Response } from '../params';

export interface CustomMessage {
    messages?: JSON | Record<string, any>;
    message: string;
    params: JSON | Record<string, any>;
    callback: (request: any) => Promise<{ message: string; params?: Record<string, any> }>;
}

export declare function customMessage<R extends Record<string, any>>(
    params: Params<CustomMessage>,
): Response<R>;
