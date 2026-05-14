import { Alert, Pressable, Share } from 'react-native';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { Button, HStack, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { AddressFormatter } from '@suite-native/formatters';
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
                <AddressFormatter
                    value={address}
                    format="full"
                    variant="headline-sm"
                    textAlign="center"
                    testID="@receive/confirmed-receive-address"
                />
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
                    size="medium"
                    iconLeft="copy"
                    onPress={handleCopyAddress}
                    intent="neutral"
                    priority="secondary"
                >
                    <Translation id="qrCode.copyButton" />
                </Button>
                <Button
                    size="medium"
                    iconLeft="shareNetwork"
                    intent="neutral"
                    priority="secondary"
                    onPress={handleShareData}
                >
                    <Translation id="qrCode.shareButton" />
                </Button>
            </HStack>
        </VStack>
    );
};
