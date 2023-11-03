import { Alert, Share } from 'react-native';

import { A, pipe } from '@mobily/ts-belt';

import { Box, Text, Button, VStack, HStack } from '@suite-native/atoms';
import { splitAddressToChunks, useCopyToClipboard } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { QRCode } from './QRCode';

type AddressQRCodeProps = {
    address: string;
};

export const AddressQRCode = ({ address }: AddressQRCodeProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();

    const handleCopyAddress = async () => {
        await copyToClipboard(address, translate('qrCode.addressCopied'));
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

    const formattedAddress = pipe(address, splitAddressToChunks, A.join(' '));

    return (
        <VStack spacing="large">
            <QRCode data={address} />
            <Box alignItems="center" justifyContent="center">
                <Text variant="titleSmall" textAlign="center">
                    {formattedAddress}
                </Text>
            </Box>
            <HStack spacing="small" justifyContent="center">
                <Button
                    size="small"
                    iconLeft="copy"
                    onPress={handleCopyAddress}
                    colorScheme="tertiaryElevation1"
                    testID="@receive/addressQrCode/copyButton"
                >
                    {translate('qrCode.copyButton')}
                </Button>
                <Button
                    size="small"
                    iconLeft="shareAlt"
                    colorScheme="tertiaryElevation1"
                    onPress={handleShareData}
                >
                    {translate('qrCode.shareButton')}
                </Button>
            </HStack>
        </VStack>
    );
};
