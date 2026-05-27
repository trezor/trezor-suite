import { useCallback } from 'react';

import { commonQueryKeys, useQuery, useQueryClient } from '@suite-common/react-query';
import { useFreshRef } from '@trezor/react-utils';
import { delay } from '@trezor/utils';

import { type MerklUsersRewardsRequestBodyItem } from '../../api/types';
import { queriesStaleTime } from '../../config';
import { getMerklUsersRewards } from '../../services';

export type MerkleRewardsParams<Address extends string> = {
    address: Address;
    chainId: number;
};

export function useGetMerkleRewards<Address extends string>(
    queryEntries: MerkleRewardsParams<Address>[],
) {
    const queryResult = useQuery({
        queryKey: commonQueryKeys.merkleRewards(queryEntries),
        staleTime: queriesStaleTime.getMerkleRewards,
        queryFn({ signal }) {
            return getMerklUsersRewards({ body: queryEntries, signal });
        },
    });

    const queryClient = useQueryClient();
    const queryEntriesRef = useFreshRef(queryEntries);
    const chainsRewardsRef = useFreshRef(queryResult.data);

    /**
     * - Force Merkle to return fresh rewards after claiming has completed and the tx is confirmed on-chain.
     * - It resolves once Merkle return empty rewards = actually finished processing the claim.
     */
    const waitForMerkleToResolveClaim = useCallback(async () => {
        let attempts = 30;

        await queryClient.invalidateQueries({
            queryKey: commonQueryKeys.merkleRewards(queryEntriesRef.current),
            type: 'inactive',
        });

        // Refetch until it returns no rewards (i.e. the claim was finalized by Merkle)
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
            queryKey: commonQueryKeys.merkleRewards(queryEntriesRef.current),
            type: 'inactive',
        });
    }, [queryClient, queryEntriesRef, chainsRewardsRef]);

    return {
        ...queryResult,
        waitForMerkleToResolveClaim,
    };
}

export type MerkleChainsRewards = NonNullable<Awaited<ReturnType<typeof getMerklUsersRewards>>>;
