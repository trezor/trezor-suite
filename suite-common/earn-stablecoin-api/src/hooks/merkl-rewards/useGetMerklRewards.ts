import { useCallback } from 'react';

import { type MerklUsersRewardsRequestBodyItem } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useQuery, useQueryClient } from '@suite-common/react-query';
import { useFreshRef } from '@trezor/react-utils';
import { delay } from '@trezor/utils';

import { queriesStaleTime } from '../../config';
import { getMerklUsersRewards } from '../../services';

export type MerklRewardsParams<Address extends string> = {
    address: Address;
    chainId: number;
};

export function useGetMerklRewards<Address extends string>(
    queryEntries: MerklRewardsParams<Address>[],
) {
    const queryResult = useQuery({
        queryKey: commonQueryKeys.merklRewards(queryEntries),
        staleTime: queriesStaleTime.getMerklRewards,
        queryFn({ signal }) {
            return getMerklUsersRewards({ body: queryEntries, signal });
        },
    });

    const queryClient = useQueryClient();
    const queryEntriesRef = useFreshRef(queryEntries);
    const chainsRewardsRef = useFreshRef(queryResult.data);

    /**
     * - Force Merkl to return fresh rewards after claiming has completed and the tx is confirmed on-chain.
     * - It resolves once Merkl returns empty rewards = actually finished processing the claim.
     */
    const waitForMerklToResolveClaim = useCallback(async () => {
        let attempts = 30;

        await queryClient.invalidateQueries({
            queryKey: commonQueryKeys.merklRewards(queryEntriesRef.current),
            type: 'inactive',
        });

        // Refetch until it returns no rewards (i.e. the claim was finalized by Merkl)
        while (chainsRewardsRef.current && chainsRewardsRef.current.length > 0 && attempts > 0) {
            // Do direct API calls to avoid manipulating with React Query cache (because once the the endpoint returns empty rewards, the component would rerender with empty rewards state instead of successfull one)
            const rewards = await getMerklUsersRewards({
                body: queryEntriesRef.current.map(
                    entry =>
                        ({
                            address: entry.address,
                            chainId: entry.chainId,
                            reloadChainId: entry.chainId,
                        }) satisfies MerklUsersRewardsRequestBodyItem,
                ),
            });

            if (rewards.length === 0) {
                break;
            }

            await delay(2000);
            attempts--;
        }

        await queryClient.invalidateQueries({
            queryKey: commonQueryKeys.merklRewards(queryEntriesRef.current),
            type: 'inactive',
        });
    }, [queryClient, queryEntriesRef, chainsRewardsRef]);

    return {
        ...queryResult,
        waitForMerklToResolveClaim,
    };
}

export type MerklChainsRewards = NonNullable<Awaited<ReturnType<typeof getMerklUsersRewards>>>;
