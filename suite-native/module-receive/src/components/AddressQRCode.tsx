import { Pressable } from 'react-native';

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

const cardStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp16,
    paddingHorizontal: utils.spacings.sp24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: utils.spacings.sp8,
    marginTop: utils.spacings.sp8,
}));

const RECEIVE_QR_CODE_SIZE = 310;

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

    return (
        <VStack spacing="sp24" flex={1}>
            <Pressable onLongPress={handleCopyAddress}>
                <Card style={applyStyle(cardStyle)}>
                    <QRCode
                        data={address}
                        size={RECEIVE_QR_CODE_SIZE}
                        paddingHorizontal="sp24"
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
