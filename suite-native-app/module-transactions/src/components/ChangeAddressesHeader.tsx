import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type ChangeAddressesHeaderProps = { addressesCount: number };

export const ChangeAddressesHeader = ({ addressesCount }: ChangeAddressesHeaderProps) => (
    <Box>
        <HStack alignItems="center">
            <Icon name="change" color="contentSecondary" size="medium" />
            <Text color="contentSecondary" variant="body-sm">
                <Translation
                    id="transactions.TransactionDetailScreen.addressesSheet.changeAddresses"
                    values={{ count: addressesCount }}
                />
            </Text>
        </HStack>
    </Box>
);
