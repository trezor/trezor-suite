import type { Params, Response } from '../params';
import type { MoneroGetWatchKey, MoneroWatchKey } from './monero';

export declare function moneroGetWatchKey(
    params: Params<MoneroGetWatchKey>,
): Response<MoneroWatchKey>;
