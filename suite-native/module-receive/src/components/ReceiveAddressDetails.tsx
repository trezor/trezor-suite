import { useWindowDimensions } from 'react-native';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountDescriptor, type TokenAddress } from '@suite-common/wallet-types';
import { AddressLabelEditable } from '@suite-native/address';
import { Box, VStack } from '@suite-native/atoms';
import { ClipboardCopyMenu } from '@suite-native/clipboard';
import { AddressFormatter } from '@suite-native/formatters';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useReceiveAddressInteractions } from './ReceiveAddressInteractionsProvider';
import { ReceiveQRCodeCard } from './ReceiveQRCodeCard';
import { RECEIVE_QR_CODE_PADDING } from './ReceiveQRCodeCard.styles';

type ReceiveAddressDetailsProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    showLabelEdit?: boolean;
};

const addressContainer = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

const MAX_RECEIVE_QR_CODE_SIZE = 310;

export const ReceiveAddressDetails = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
    tokenContract,
    showLabelEdit = true,
}: ReceiveAddressDetailsProps) => {
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();
    const { width: windowWidth } = useWindowDimensions();
    const { handleCopyAddress } = useReceiveAddressInteractions();

    const screenHorizontalPadding = spacings.sp16 * 2;
    const cardHorizontalMargin = spacings.sp8 * 2;
    const qrCodePadding = spacings[RECEIVE_QR_CODE_PADDING] * 2;
    const horizontalOffset = screenHorizontalPadding + cardHorizontalMargin + qrCodePadding;
    const qrCodeSize = Math.min(MAX_RECEIVE_QR_CODE_SIZE, windowWidth - horizontalOffset);

    return (
        <VStack spacing="sp24" flex={1}>
            <Box marginHorizontal="sp8" marginTop="sp8">
                <ReceiveQRCodeCard
                    address={address}
                    networkSymbol={networkSymbol}
                    tokenContract={tokenContract}
                    qrCodeSize={qrCodeSize}
                    onCopyAddress={handleCopyAddress}
                />
            </Box>
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
                <ClipboardCopyMenu onCopy={handleCopyAddress} style={applyStyle(addressContainer)}>
                    <AddressFormatter
                        value={address}
                        format="long"
                        variant="headline-sm"
                        textAlign="center"
                        testID="@receive/confirmed-receive-address"
                    />
                </ClipboardCopyMenu>
            </VStack>
        </VStack>
    );
};
