import { Box, Card, Divider, HStack, Text, VerticalDivider } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { VoucherList } from './VoucherList';
import { type ProgramProps, type VoucherProps, type VoucherStats } from '../hooks/useReferAFriend';

type RewardsCardProps = {
    program: ProgramProps;
    stats: VoucherStats;
    vouchers: VoucherProps[];
};

export const RewardsCard = ({ program, stats, vouchers }: RewardsCardProps) => (
    <Card noPadding>
        <Box margin="sp16" alignItems="center">
            <Text variant="headline-md">
                {stats.totalEarned}
                <Text color="contentTertiary"> / {program.annualRewardLimit}</Text>
            </Text>
            <Text variant="body-sm" color="contentSecondary">
                <Translation id="referAFriend.voucherList.totalEarned" />
            </Text>
        </Box>
        <Divider />
        <HStack margin="sp16" justifyContent="space-evenly" spacing="sp12">
            <Box alignItems="center">
                <Text variant="headline-sm">{stats.availableVouchers}</Text>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="referAFriend.voucherList.vouchers" />
                </Text>
            </Box>
            <VerticalDivider />
            <Box alignItems="center">
                <Text variant="headline-sm">
                    {vouchers.length}
                    <Text color="contentTertiary"> / {program.annualReferralLimit}</Text>
                </Text>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="referAFriend.voucherList.referrals" />
                </Text>
            </Box>
        </HStack>
        <Divider />
        <VoucherList vouchers={vouchers} />
    </Card>
);
