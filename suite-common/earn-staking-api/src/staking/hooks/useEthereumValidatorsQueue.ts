import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { type EthValidatorsQueue } from '../../api/types';
import { getEthereumValidatorsQueue } from '../services';

interface UseEthereumValidatorsQueueProps {
    account: Account | null;
    timestamp?: number;
}

export function useEthereumValidatorsQueue(
    { account, timestamp }: UseEthereumValidatorsQueueProps,
    {
        enabled = Boolean(account),
        ...restQueryOptions
    }: Omit<
        UseQueryOptions<EthValidatorsQueue, ResponseError | ResponseValidationError>,
        'queryKey'
    > = {},
) {
    return useQuery({
        staleTime: 60 * 1000, // 1 minute
        ...restQueryOptions,
        enabled,
        queryKey: commonQueryKeys.validatorsQueue(account?.key, timestamp),
        queryFn: () =>
            getEthereumValidatorsQueue({
                params: { timestamp },
            }),
    });
}
