import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type ChangeAddressesHeaderProps = { addressesCount: number };

export const ChangeAddressesHeader = ({ addressesCount }: ChangeAddressesHeaderProps) => (
    <Box>
        <HStack alignItems="center">
            <Icon name="change" color="iconSubdued" size="medium" />
            <Text color="textSubdued" variant="body-sm">
                <Translation
                    id="transactions.TransactionDetailScreen.addressesSheet.changeAddresses"
                    values={{ count: addressesCount }}
                />
            </Text>
        </HStack>
    </Box>
);
