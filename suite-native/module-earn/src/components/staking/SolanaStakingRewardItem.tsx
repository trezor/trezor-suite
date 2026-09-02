import { type SolRewardsHistoryRewardsItem } from '@suite-common/earn-staking-api';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Card, HStack, RoundedIcon, Text, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

type SolanaStakingRewardItemProps = {
    reward: SolRewardsHistoryRewardsItem;
    symbol: NetworkSymbol;
};

export const SolanaStakingRewardItem = ({ reward, symbol }: SolanaStakingRewardItemProps) => {
    const { DateFormatter } = useFormatters();

    return (
        <VStack spacing="sp8" marginTop="sp24" marginHorizontal="sp16">
            <Text variant="body-sm-strong" color="contentSecondary">
                {DateFormatter.format(Date.parse(reward.time))}
            </Text>
            <Card>
                <HStack alignItems="center" spacing="sp12">
                    <RoundedIcon name="piggyBank" intent="neutral" size={40} />
                    <VStack flex={1} spacing="sp2">
                        <Text variant="body-md">
                            <Translation id="earn.stakingManagementScreen.rewardsList.itemLabel" />
                        </Text>
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation
                                id="earn.stakingManagementScreen.rewardsList.epoch"
                                values={{ epoch: reward.epoch }}
                            />
                        </Text>
                    </VStack>
                    <VStack spacing="sp4" alignItems="flex-end">
                        <Box flexDirection="row">
                            <SignValueFormatter value="positive" />
                            <CryptoToFiatAmountFormatter value={reward.amount} symbol={symbol} />
                        </Box>
                        <CompactCryptoAmountFormatter
                            value={reward.amount}
                            symbol={symbol}
                            isBalance={false}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            variant="body-sm"
                            color="contentSecondary"
                        />
                    </VStack>
                </HStack>
            </Card>
        </VStack>
    );
};
