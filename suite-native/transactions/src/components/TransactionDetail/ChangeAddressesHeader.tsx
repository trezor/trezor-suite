import { Box, HStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-common/icons-deprecated';

type ChangeAddressesHeaderProps = { addressesCount: number };

export const ChangeAddressesHeader = ({ addressesCount }: ChangeAddressesHeaderProps) => {
    const changeAddressesTitle = `Change Address${
        addressesCount > 1 ? `es · ${addressesCount}` : ''
    }`;

    return (
        <Box>
            <HStack alignItems="center">
                <Icon name="change" color="iconSubdued" size="medium" />
                <Text color="textSubdued" variant="hint">
                    {changeAddressesTitle}
                </Text>
            </HStack>
        </Box>
    );
};
