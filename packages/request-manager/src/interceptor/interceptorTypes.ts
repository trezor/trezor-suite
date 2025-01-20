import { InterceptorOptions } from '../types';
import { createRequestPool } from '../httpPool';
import { TorIdentities } from '../torIdentities';

export type InterceptorContext = InterceptorOptions & {
    requestPool: ReturnType<typeof createRequestPool>;
    torIdentities: TorIdentities;
};

export type Interceptor = (params: {
    context: InterceptorContext;
    validateRequest: ({ hostname }: { hostname: string }) => void;
}) => void;
