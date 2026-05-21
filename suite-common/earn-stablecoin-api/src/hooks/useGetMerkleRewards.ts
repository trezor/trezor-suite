import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { type MerkleClaimableReward } from '../api/types';
import { queriesStaleTime } from '../config';
import { getMerkleUserRewards } from '../services';

export class ChainAddressKey {
    static readonly delimiter = ':';

    static compose(chainId: number, address: string) {
        return `${chainId}${ChainAddressKey.delimiter}${address}` as const;
    }

    static parse(key: string) {
        const [chainId, address] = key.split(ChainAddressKey.delimiter);

        return {
            chainId: Number(chainId),
            address,
        } as const;
    }
}

export type MerkleRewardsParams<Address extends string> = {
    address: Address;
    chainId: number;
    reloadChainId?: number;
};

export function useGetMerkleRewards<Address extends string>(
    queryEntries: MerkleRewardsParams<Address>[],
) {
    return useQuery({
        queryKey: commonQueryKeys.merkleRewards(queryEntries),
        staleTime: queriesStaleTime.getMerkleRewards,
        async queryFn({ signal, meta }) {
            const requests = queryEntries.map(entry =>
                getMerkleUserRewards({
                    routeParams: { address: entry.address },
                    params: {
                        chainId: entry.chainId,
                        claimableOnly: true,
                        // Force fresh data by default. This will be improved later, but for now it seems that Merkle sends obsolete data (reloadChainId).
                        reloadChainId: meta?.bypassCache === false ? undefined : entry.chainId,
                    },
                    signal,
                }),
            );

            const usersChainRewards = await Promise.all(requests);

            return usersChainRewards.reduce<Record<string, MerkleClaimableReward[]>>(
                (result, chainsRewards, index) => {
                    const { address, chainId } = queryEntries[index];
                    const key = ChainAddressKey.compose(chainId, address);

                    result[key] = chainsRewards.flatMap(chainRewards => chainRewards.rewards);

                    return result;
                },
                {},
            );
        },
    });
}

export type MerkleRewardsByChainAndAddress = NonNullable<
    Awaited<ReturnType<typeof useGetMerkleRewards>['data']>
>;
