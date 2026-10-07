import type { QueryClient } from '@tanstack/react-query';

/** The query cache, for services that refresh or drop cached data outside React. */
export type QueryClientDep = { queryClient: QueryClient };

export const injectQueryClient = (services: any): QueryClientDep => ({
    queryClient: services.queryClient,
});
