import { Pressable, useWindowDimensions } from 'react-native';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor } from '@suite-common/wallet-types';
import { AddressLabelEditable } from '@suite-native/address';
import { Card, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { AddressFormatter } from '@suite-native/formatters';
import { useTranslate } from '@suite-native/intl';
import { QRCode } from '@suite-native/qr-code';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type ReceiveAddressDetailsProps = {
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

const cardStyle = prepareNativeStyle(utils => ({
    marginHorizontal: utils.spacings.sp8,
    marginTop: utils.spacings.sp8,
}));

const MAX_RECEIVE_QR_CODE_SIZE = 310;

export const ReceiveAddressDetails = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
    showLabelEdit = true,
}: ReceiveAddressDetailsProps) => {
    const copyToClipboard = useCopyToClipboard();
    const { translate } = useTranslate();
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();
    const { width: windowWidth } = useWindowDimensions();

    const screenHorizontalPadding = spacings.sp16 * 2;
    const cardHorizontalMargin = spacings.sp8 * 2;
    const qrCodeHorizontalPadding = spacings.sp16 * 2;
    const horizontalOffset =
        screenHorizontalPadding + cardHorizontalMargin + qrCodeHorizontalPadding;
    const qrCodeSize = Math.min(MAX_RECEIVE_QR_CODE_SIZE, windowWidth - horizontalOffset);

    const handleCopyAddress = async () => {
        await copyToClipboard(address, translate('qrCode.addressCopied'));
    };

    return (
        <VStack spacing="sp24" flex={1}>
            <Pressable onLongPress={handleCopyAddress}>
                <Card noPadding style={applyStyle(cardStyle)}>
                    <QRCode
                        data={address}
                        qrCodeSize={qrCodeSize}
                        paddingHorizontal="sp16"
                        paddingVertical="sp16"
                    />
                </Card>
            </Pressable>
            <VStack spacing="sp8" alignItems="center" justifyContent="center" flex={1}>
                {showLabelEdit && (
                    <AddressLabelEditable
                        accountDescriptor={accountDescriptor}
                        address={address}
                        deviceStaticSessionId={deviceStaticSessionId}
                        networkSymbol={networkSymbol}
                        testID="@receive/address-label"
                    />
                )}
                <Pressable onLongPress={handleCopyAddress} style={applyStyle(addressContainer)}>
                    <AddressFormatter
                        value={address}
                        format="long"
                        variant="headline-sm"
                        textAlign="center"
                        testID="@receive/confirmed-receive-address"
                    />
                </Pressable>
            </VStack>
        </VStack>
    );
};
