import { type JSX, useCallback, useState } from 'react';

import { FlashList } from '@shopify/flash-list';

import {
    type SolRewardsHistoryRewardsItem,
    useSolanaRewardsHistory,
} from '@suite-common/earn-staking-api';
import { type Account } from '@suite-common/wallet-types';
import { Box, ListItemSkeleton, Loader, VStack } from '@suite-native/atoms';

import { SolanaStakingRewardItem } from './SolanaStakingRewardItem';
import { SolanaStakingRewardsEmptyState } from './SolanaStakingRewardsEmptyState';

const SOL_REWARDS_PAGE_SIZE = 20;

type SolanaStakingRewardsListProps = {
    account: Account;
    listHeaderComponent: JSX.Element;
};

const RewardsSkeleton = () => (
    <VStack marginTop="sp24" marginHorizontal="sp16" spacing="sp24">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
    </VStack>
);

export const SolanaStakingRewardsList = ({
    account,
    listHeaderComponent,
}: SolanaStakingRewardsListProps) => {
    const [limit, setLimit] = useState(SOL_REWARDS_PAGE_SIZE);

    const rewardsQuery = useSolanaRewardsHistory(account, { limit, offset: 0 });

    const rewards = rewardsQuery.data?.rewards ?? [];
    const totalCount = rewardsQuery.data?.totalCount ?? 0;
    const hasMoreRewards = rewards.length < totalCount;
    const isFetchingMoreRewards = rewardsQuery.isFetching && rewards.length > 0;

    const handleEndReached = useCallback(() => {
        if (hasMoreRewards && !rewardsQuery.isFetching) {
            setLimit(prevLimit => prevLimit + SOL_REWARDS_PAGE_SIZE);
        }
    }, [hasMoreRewards, rewardsQuery.isFetching]);

    const renderItem = useCallback(
        ({ item }: { item: SolRewardsHistoryRewardsItem }) => (
            <SolanaStakingRewardItem reward={item} symbol={account.symbol} />
        ),
        [account.symbol],
    );

    return (
        <Box flex={1}>
            <FlashList<SolRewardsHistoryRewardsItem>
                data={rewards}
                renderItem={renderItem}
                keyExtractor={item => String(item.epoch)}
                ListHeaderComponent={listHeaderComponent}
                ListEmptyComponent={
                    rewardsQuery.isLoading ? (
                        <RewardsSkeleton />
                    ) : (
                        <SolanaStakingRewardsEmptyState />
                    )
                }
                ListFooterComponent={
                    isFetchingMoreRewards ? (
                        <VStack marginVertical="sp24" alignItems="center">
                            <Loader />
                        </VStack>
                    ) : null
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
            />
        </Box>
    );
};
