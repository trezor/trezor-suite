import { desktopQueryKeys, useQuery } from '@suite-common/react-query';

import { getProvider } from '../api';

/**
 * Provider metadata for a yield provider ID.
 * @url https://docs.yield.xyz/reference/providerscontroller_getprovider
 */
export function useGetYieldProvider(providerId?: string) {
    return useQuery({
        enabled: Boolean(providerId),
        queryKey: desktopQueryKeys.yieldProvider(providerId),
        queryFn: () => getProvider({ providerId: providerId! }),
    });
}
