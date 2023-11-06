import { Alert, Share } from 'react-native';

import { pipe, S, A } from '@mobily/ts-belt';

import { Box, Text, Button, ButtonBackgroundElevation, VStack, HStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';

import { QRCode } from './QRCode';

type AddressQRCodeProps = {
    address: string;
    backgroundElevation?: ButtonBackgroundElevation;
};

const ON_COPY_MESSAGE = 'Address copied';

const splitStringByFourCharacters = (address: string) =>
    pipe(address, S.splitByRe(/(.{4})/g), A.join(' '));

export const AddressQRCode = ({ address, backgroundElevation = '0' }: AddressQRCodeProps) => {
    const copyToClipboard = useCopyToClipboard();

    const handleCopyAddress = async () => {
        await copyToClipboard(address, ON_COPY_MESSAGE);
    };

    const handleShareData = async () => {
        try {
            await Share.share({
                message: address,
            });
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    const formattedAddress = splitStringByFourCharacters(address);

    return (
        <VStack spacing="large">
            <QRCode data={address} />
            <Box alignItems="center" justifyContent="center">
                <Text variant="titleSmall" textAlign="center">
                    {formattedAddress}
                </Text>
            </Box>
            <HStack spacing="s" justifyContent="center">
                <Button
                    size="s"
                    iconLeft="copy"
                    onPress={handleCopyAddress}
                    colorScheme={`tertiaryElevation${backgroundElevation}`}
                >
                    Copy
                </Button>
                <Button
                    size="s"
                    iconLeft="shareAlt"
                    colorScheme={`tertiaryElevation${backgroundElevation}`}
                    onPress={handleShareData}
                >
                    Share
                </Button>
            </HStack>
        </VStack>
    );
};
