import { Alert, Pressable, Share } from 'react-native';

import { Text, Button, VStack, HStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { useTranslate, Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { QRCode } from './QRCode';

type AddressQRCodeProps = {
    address: string;
};

const addressContainer = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

export const AddressQRCode = ({ address }: AddressQRCodeProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

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

    return (
        <VStack spacing="large">
            <QRCode data={address} />
            <Pressable onLongPress={handleCopyAddress} style={applyStyle(addressContainer)}>
                <Text variant="titleSmall" textAlign="center">
                    {address}
                </Text>
            </Pressable>
            <HStack spacing="small" justifyContent="center">
                <Button
                    size="small"
                    viewLeft="copy"
                    onPress={handleCopyAddress}
                    colorScheme="tertiaryElevation1"
                >
                    <Translation id="qrCode.copyButton" />
                </Button>
                <Button
                    size="small"
                    viewLeft="shareAlt"
                    colorScheme="tertiaryElevation1"
                    onPress={handleShareData}
                >
                    <Translation id="qrCode.shareButton" />
                </Button>
            </HStack>
        </VStack>
    );
};
