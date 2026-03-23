import { Alert, Pressable, Share } from 'react-native';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation, useTranslate } from '@suite-native/intl';
import { AddressLabelEditable } from '@suite-native/labeling';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { QRCode } from './QRCode';

type AddressQRCodeProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    showLabelEdit?: boolean;
};

const addressContainer = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));
export const AddressQRCode = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
    showLabelEdit = true,
}: AddressQRCodeProps) => {
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
        <VStack spacing="sp24">
            <QRCode data={address} />
            <Pressable onLongPress={handleCopyAddress} style={applyStyle(addressContainer)}>
                <Text
                    variant="headline-sm"
                    textAlign="center"
                    testID="@receive/confirmed-receive-address"
                >
                    {address}
                </Text>
            </Pressable>
            {showLabelEdit && (
                <AddressLabelEditable
                    accountDescriptor={accountDescriptor}
                    address={address}
                    deviceStaticSessionId={deviceStaticSessionId}
                    networkSymbol={networkSymbol}
                    testID="@receive/address-label"
                />
            )}
            <HStack spacing="sp8" justifyContent="center">
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
                    viewLeft="shareNetwork"
                    colorScheme="tertiaryElevation1"
                    onPress={handleShareData}
                >
                    <Translation id="qrCode.shareButton" />
                </Button>
            </HStack>
        </VStack>
    );
};
