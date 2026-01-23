import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { client } from '../client';

export const useDappScan = (url?: string) =>
    useQuery({
        enabled: Boolean(url),
        queryKey: commonQueryKeys.dappScan(url),
        queryFn: async () => {
            const scanResult = await client.site.scan({ url: url! });
            const isMalicious = scanResult?.status === 'hit' && scanResult.is_malicious;

            return {
                ...scanResult,
                isMalicious,
            };
        },
    });
