import { Alert, Pressable, Share } from 'react-native';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/local-first-storage';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AddAddressLabel } from './AddAddressLabel';
import { QRCode } from './QRCode';

type AddressQRCodeProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
};

const addressContainer = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

export const AddressQRCode = ({ address, deviceStaticSessionId }: AddressQRCodeProps) => {
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

    const label = useSelector(
        (state: WithLabelingState) =>
            (address !== undefined
                ? selectAddressLabel({
                      state,
                      address,
                      deviceStaticSessionId,
                  })
                : null
            )?.label ?? null,
    );

    return (
        <VStack spacing="sp24">
            <QRCode data={address} />
            <Pressable onLongPress={handleCopyAddress} style={applyStyle(addressContainer)}>
                <Text
                    variant="titleSmall"
                    textAlign="center"
                    testID="@receive/confirmed-receive-address"
                >
                    {address}
                </Text>
            </Pressable>
            <AddAddressLabel
                address={address}
                deviceStaticSessionId={deviceStaticSessionId}
                label={label}
            />
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
