import { type createRequestPool } from '../httpPool';
import { type TorIdentities } from '../torIdentities';
import { type InterceptorOptions } from '../types';

export type InterceptorContext = InterceptorOptions & {
    requestPool: ReturnType<typeof createRequestPool>;
    torIdentities: TorIdentities;
};

export type Interceptor = (params: {
    context: InterceptorContext;
    validateRequest: ({ hostname }: { hostname: string }) => void;
}) => void;
