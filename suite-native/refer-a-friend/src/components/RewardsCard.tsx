import {
    type ReferralProgramData,
    type ReferralRewards,
    createFormatAmount,
} from '@suite-common/refer-a-friend';
import { Box, Card, Divider, HStack, Text, VerticalDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { VoucherList } from './VoucherList';

type RewardsCardProps = {
    programData: ReferralProgramData;
    rewards: ReferralRewards;
};

export const RewardsCard = ({ programData, rewards }: RewardsCardProps) => {
    const formatAmount = createFormatAmount(rewards.fiatCurrency);

    return (
        <Card noPadding>
            <Box margin="sp16" alignItems="center">
                <Text variant="headline-md">
                    {formatAmount(rewards.totalEarnedAmount)}
                    <Text color="contentTertiary"> / {programData.periodRewardAmountLimit}</Text>
                </Text>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="referAFriend.voucherList.totalEarned" />
                </Text>
            </Box>
            <Divider />
            <HStack margin="sp16" justifyContent="space-evenly" spacing="sp12">
                <Box alignItems="center">
                    <Text variant="headline-sm">{rewards.availableVoucherCount}</Text>
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id="referAFriend.voucherList.vouchers" />
                    </Text>
                </Box>
                <VerticalDivider />
                <Box alignItems="center">
                    <Text variant="headline-sm">
                        {rewards.vouchers.length}
                        <Text color="contentTertiary"> / {programData.periodReferralLimit}</Text>
                    </Text>
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation id="referAFriend.voucherList.referrals" />
                    </Text>
                </Box>
            </HStack>
            <Divider />
            <VoucherList vouchers={rewards.vouchers} formatAmount={formatAmount} />
        </Card>
    );
};
