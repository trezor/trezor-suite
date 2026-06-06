import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Card, HStack, ListItemSkeleton, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { BigNumber } from '@trezor/utils';

import { type StablecoinYieldAccountRewards } from '../utils/stablecoinYieldClaimSummaryUtils';

type StablecoinYieldClaimReward = StablecoinYieldAccountRewards['rewards'][number];

type YieldClaimRewardItemProps = {
    isFiatLoading: boolean;
    networkSymbol: NetworkSymbol;
    reward: StablecoinYieldClaimReward;
};

const YieldClaimRewardItem = ({
    isFiatLoading,
    networkSymbol,
    reward,
}: YieldClaimRewardItemProps) => {
    const claimableAmount = useMemo(
        () =>
            subunitsToUnits({
                value: asAmountSubunit(new BigNumber(reward.claimable)),
                decimals: reward.token.decimals,
            }).toString(),
        [reward.claimable, reward.token.decimals],
    );
    const isFiatAmountVisible = reward.fiat.claimable !== null || isFiatLoading;

    return (
        <HStack spacing="sp16" justifyContent="space-between" alignItems="center">
            <HStack spacing="sp4" alignItems="center" flex={1}>
                <CryptoIcon
                    symbol={networkSymbol}
                    contractAddress={toTokenAddress(reward.token.address)}
                    size={20}
                />
                <CryptoAmountFormatter
                    value={claimableAmount}
                    symbol={toTokenSymbol(reward.token.symbol)}
                    decimals={reward.token.decimals}
                    variant="body-sm-strong"
                    color="contentPrimary"
                    isDiscreetText={false}
                    numberOfLines={1}
                />
            </HStack>
            {isFiatAmountVisible && (
                <HStack spacing="sp2" alignItems="center" justifyContent="flex-end">
                    {!isFiatLoading && (
                        <Text variant="body-sm" color="contentSecondary">
                            ≈
                        </Text>
                    )}
                    <BaseCurrencyAmountFormatter
                        value={reward.fiat.claimable}
                        variant="body-sm"
                        color="contentSecondary"
                        isDiscreetText={false}
                        isLoading={isFiatLoading}
                        numberOfLines={1}
                    />
                </HStack>
            )}
        </HStack>
    );
};

type YieldClaimRewardsCardProps = {
    accountRewards: StablecoinYieldAccountRewards | null;
    isFiatLoading: boolean;
    isLoading: boolean;
};

const YieldClaimRewardsCardContent = ({
    accountRewards,
    isFiatLoading,
    isLoading,
}: YieldClaimRewardsCardProps) => {
    if (isLoading) {
        return <ListItemSkeleton />;
    }

    if (accountRewards) {
        return accountRewards.rewards.map((reward, index) => (
            <YieldClaimRewardItem
                key={`${reward.token.address}:${index}`}
                isFiatLoading={isFiatLoading}
                networkSymbol={accountRewards.account.symbol}
                reward={reward}
            />
        ));
    }

    return (
        <Text variant="body-sm" color="contentSecondary">
            <Translation id="earn.yieldClaimFlowScreen.noRewards" />
        </Text>
    );
};

export const YieldClaimRewardsCard = ({
    accountRewards,
    isFiatLoading,
    isLoading,
}: YieldClaimRewardsCardProps) => (
    <Card borderColor="borderNeutral">
        <VStack spacing="sp12">
            <Text variant="body-md">
                <Translation id="earn.yieldClaimFlowScreen.rewards" />
            </Text>
            <YieldClaimRewardsCardContent
                accountRewards={accountRewards}
                isFiatLoading={isFiatLoading}
                isLoading={isLoading}
            />
        </VStack>
    </Card>
);
