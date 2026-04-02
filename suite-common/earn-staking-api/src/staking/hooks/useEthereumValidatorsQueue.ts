import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { type EthValidatorsQueue } from '../../api/types';
import { getEthereumValidatorsQueue } from '../services';

interface UseEthereumValidatorsQueueProps {
    account: Account;
    timestamp?: number;
}

export function useEthereumValidatorsQueue(
    { account, timestamp }: UseEthereumValidatorsQueueProps,
    queryOptions?: UseQueryOptions<EthValidatorsQueue, ResponseError | ResponseValidationError>,
) {
    return useQuery({
        staleTime: 60 * 1000, // 1 minute
        ...queryOptions,
        queryKey: commonQueryKeys.validatorsQueue(account.key, timestamp),
        queryFn: () =>
            getEthereumValidatorsQueue({
                params: { timestamp },
            }),
    });
}
