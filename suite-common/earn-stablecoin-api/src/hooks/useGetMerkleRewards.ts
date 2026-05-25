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
        const parsed = key.split(ChainAddressKey.delimiter);

        // @ts-expect-error: noUncheckedIndexedAccess
        const chainId: string = parsed[0];
        // @ts-expect-error: noUncheckedIndexedAccess
        const address: string = parsed[1];

        return {
            chainId: Number(chainId),
            address,
        } as const;
    }
}

export type MerkleRewardsParams<Address extends string> = {
    address: Address;
    chainId: number;
};

interface GetMerkleRewardsProps {
    queryEntries: MerkleRewardsParams<string>[];
    signal?: AbortSignal;
    meta?: {
        bypassCache?: boolean;
    };
}

export async function getMerkleRewards({ queryEntries, signal, meta }: GetMerkleRewardsProps) {
    const requests = queryEntries.map(entry =>
        getMerkleUserRewards({
            routeParams: { address: entry.address },
            params: {
                chainId: entry.chainId,
                claimableOnly: true,
                // Force fresh data by default. Merkle API returns Cloudflare cache (<= 60s) if sent without `reloadChainId`.
                reloadChainId: meta?.bypassCache === false ? undefined : entry.chainId,
            },
            signal,
        }),
    );

    const usersChainRewards = await Promise.all(requests);

    const usersRewardsByChainAndAddress = usersChainRewards.reduce<
        Record<string, MerkleClaimableReward[]>
    >((result, chainsRewards, index) => {
        // @ts-expect-error: noUncheckedIndexedAccess
        const entry: MerkleRewardsParams<string> = queryEntries[index];
        const { address, chainId } = entry;
        const key = ChainAddressKey.compose(chainId, address);

        result[key] = chainsRewards.flatMap(chainRewards => chainRewards.rewards);

        return result;
    }, {});

    return Object.fromEntries(
        Object.entries(usersRewardsByChainAndAddress).filter(([, rewards]) => rewards.length > 0),
    );
}

export function useGetMerkleRewards<Address extends string>(
    queryEntries: MerkleRewardsParams<Address>[],
) {
    return useQuery({
        queryKey: commonQueryKeys.merkleRewards(queryEntries),
        staleTime: queriesStaleTime.getMerkleRewards,
        queryFn({ signal, meta }) {
            return getMerkleRewards({ queryEntries, signal, meta });
        },
    });
}

export type MerkleRewardsByChainAndAddress = NonNullable<
    Awaited<ReturnType<typeof useGetMerkleRewards>['data']>
>;
