import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';
import { type Account } from '@suite-common/wallet-types';

import { getSolanaRewardsTotal } from '../services';

export function useSolanaRewardsTotal<
    A extends Pick<Account, 'symbol' | 'descriptor'>,
    QueryOptions extends UseQueryOptions<string, ResponseError | ResponseValidationError, string>,
>(account: A, queryOptions?: QueryOptions) {
    return useQuery({
        ...queryOptions,
        enabled: account.symbol === 'sol',
        queryKey: commonQueryKeys.solanaRewardsTotal(account.descriptor),
        queryFn: async () => {
            const { total } = await getSolanaRewardsTotal({
                routeParams: { address: account.descriptor },
            });

            return total;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export type SolanaRewardsTotalQueryResult = ReturnType<typeof useSolanaRewardsTotal>;
