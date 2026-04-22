import { useMemo } from 'react';

import { type RewardDto } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork, Icon, cryptoIconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { getApyBreakdownDescriptionKey, sortApyRewards } from '../utils';

type StablecoinYieldApyBreakdownProps = {
    networkSymbol: NetworkSymbol;
    rewards: RewardDto[];
};

type RewardRowProps = {
    reward: RewardDto;
    networkSymbol: NetworkSymbol;
};

const RewardRow = ({ reward, networkSymbol }: RewardRowProps) => {
    const rewardRatePercent = getApyPercent(reward.rate);
    const descriptionKey = getApyBreakdownDescriptionKey(reward.yieldSource);
    const rewardSymbol = reward.token.symbol || reward.token.name || '';

    return (
        <HStack spacing="sp8" alignItems="center">
            <Box flex={1}>
                <VStack spacing={0}>
                    <HStack justifyContent="space-between">
                        <HStack alignItems="center">
                            <CryptoIconWithNetwork
                                symbol={networkSymbol}
                                contractAddress={reward.token.address as TokenAddress | undefined}
                                size="extraSmall"
                            />
                            <Text variant="body-md">{rewardSymbol}</Text>
                        </HStack>
                        {rewardRatePercent !== null && rewardRatePercent > 0 && (
                            <Text variant="body-md" color="contentPrimary">
                                +{rewardRatePercent.toFixed(2)}%
                            </Text>
                        )}
                    </HStack>
                    {descriptionKey && (
                        <Box style={{ marginLeft: cryptoIconSizes.extraSmall }} paddingLeft="sp8">
                            <Text variant="body-sm" color="contentSecondary">
                                <Translation id={descriptionKey} />
                            </Text>
                        </Box>
                    )}
                </VStack>
            </Box>
        </HStack>
    );
};

export const StablecoinYieldApyBreakdown = ({
    networkSymbol,
    rewards,
}: StablecoinYieldApyBreakdownProps) => {
    const sortedRewards = useMemo(() => sortApyRewards(rewards), [rewards]);

    return (
        <Box testID="@account-detail/stablecoin-yield/apy-breakdown-sheet">
            <VStack spacing="sp20">
                {sortedRewards.map((reward, index) => (
                    <RewardRow
                        key={`${reward.token.symbol}-${reward.yieldSource}-${index}`}
                        reward={reward}
                        networkSymbol={networkSymbol}
                    />
                ))}
                <HStack spacing="sp8" alignItems="center">
                    <Icon name="arrowsDownUp" size="medium" color="contentSecondary" />
                    <Text variant="body-md" color="contentSecondary">
                        <Translation id="moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.footer" />
                    </Text>
                </HStack>
            </VStack>
        </Box>
    );
};
