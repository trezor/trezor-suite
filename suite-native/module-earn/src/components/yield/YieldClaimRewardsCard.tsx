import { type ReactNode } from 'react';

import { Card, ListItemSkeleton, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { YieldClaimRewardItem } from './YieldClaimRewardItem';
import { sortRewardsByClaimableFiatAmount } from '../../utils/yield/sortRewardsByClaimableFiatAmount';
import { type StablecoinYieldAccountRewards } from '../../utils/yield/stablecoinYieldClaimSummaryUtils';

type YieldClaimRewardsCardProps = {
    accountRewards: StablecoinYieldAccountRewards | null;
    isFiatLoading: boolean;
    isLoading: boolean;
};

export const YieldClaimRewardsCard = ({
    accountRewards,
    isFiatLoading,
    isLoading,
}: YieldClaimRewardsCardProps) => {
    let content: ReactNode;

    if (isLoading) {
        content = <ListItemSkeleton />;
    } else if (accountRewards) {
        content = accountRewards.rewards
            .toSorted(sortRewardsByClaimableFiatAmount)
            .map((reward, index) => (
                <YieldClaimRewardItem
                    key={`${reward.token.address}:${index}`}
                    isFiatLoading={isFiatLoading}
                    networkSymbol={accountRewards.account.symbol}
                    reward={reward}
                />
            ));
    } else {
        content = (
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="earn.yieldClaimFlowScreen.noRewards" />
            </Text>
        );
    }

    return (
        <Card borderColor="borderNeutral">
            <VStack spacing="sp12">
                <Text variant="body-md">
                    <Translation id="earn.yieldClaimFlowScreen.rewards" />
                </Text>
                {content}
            </VStack>
        </Card>
    );
};
