import { Box, Divider, IconCircle, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { VoucherListItem } from './VoucherListItem';
import type { VoucherProps } from '../hooks/useReferAFriend';

type VoucherListProps = {
    vouchers: VoucherProps[];
};

export const VoucherList = ({ vouchers }: VoucherListProps) => {
    if (vouchers.length > 0) {
        return (
            <Box>
                {vouchers.map((voucher, index) => (
                    <Box key={index}>
                        <VoucherListItem voucher={voucher} ordinal={index + 1} />
                        {index < vouchers.length - 1 && <Divider />}
                    </Box>
                ))}
            </Box>
        );
    }

    return (
        <VStack marginHorizontal="sp16" marginVertical="sp40" alignItems="center">
            <IconCircle name="gift" intent="brand" size={40} />
            <Box alignItems="center">
                <Text>
                    <Translation id="referAFriend.voucherList.empty.title" />
                </Text>
                <Text variant="body-sm" color="contentSecondary">
                    <Translation id="referAFriend.voucherList.empty.subtitle" />
                </Text>
            </Box>
        </VStack>
    );
};
