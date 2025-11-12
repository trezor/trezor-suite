import type { Params, Response } from '../params';
import type { MoneroKeyImageSync, MoneroKeyImageSyncResult } from './monero';

export declare function moneroKeyImageSync(
    params: Params<MoneroKeyImageSync>,
): Response<MoneroKeyImageSyncResult>;
