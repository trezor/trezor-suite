import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { getBlockaidClient } from '../client';

export const useDappScan = (url?: string) =>
    useQuery({
        enabled: Boolean(url),
        queryKey: commonQueryKeys.dappScan(url),
        queryFn: async () => {
            const client = await getBlockaidClient();
            const scanResult = await client.site.scan({ url: url! });
            const isMalicious = scanResult?.status === 'hit' && scanResult.is_malicious;

            return {
                ...scanResult,
                isMalicious,
            };
        },
    });
