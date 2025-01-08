import { InterceptorOptions } from '../types';
import { createRequestPool } from '../httpPool';
import { TorIdentities } from '../torIdentities';

export type InterceptorContext = InterceptorOptions & {
    requestPool: ReturnType<typeof createRequestPool>;
    torIdentities: TorIdentities;
};

export const isWhitelistedHost = (
    hostname: unknown,
    whitelist: string[] = ['127.0.0.1', 'localhost'],
) =>
    typeof hostname === 'string' &&
    whitelist.some(url => url === hostname || hostname.endsWith(url));
