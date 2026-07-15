import type { MoneroKeyImageSync, MoneroKeyImageSyncResult } from './common';
import type { Params, Response } from '../../params';

export declare function moneroKeyImageSync(
    params: Params<MoneroKeyImageSync>,
): Response<MoneroKeyImageSyncResult>;
