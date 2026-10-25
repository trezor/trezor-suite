import { useState } from 'react';
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
    tokenSymbol?: string;
    showLabelEdit?: boolean;
};

const addressContainer = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

const addressStyle = prepareNativeStyle<{ width: number }>((_, { width }) => ({ width }));

const MAX_RECEIVE_QR_CODE_SIZE = 310;
const MAX_RECEIVE_QR_CODE_HEIGHT_RATIO = 0.35;

export const ReceiveAddressDetails = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
    tokenContract,
    tokenSymbol,
    showLabelEdit = true,
}: ReceiveAddressDetailsProps) => {
    const {
        applyStyle,
        utils: { spacings },
    } = useNativeStyles();
    const [contentWidth, setContentWidth] = useState(0);
    const { height: windowHeight } = useWindowDimensions();
    const { handleCopyAddress } = useReceiveAddressInteractions();

    const cardHorizontalMargin = spacings.sp8 * 2;
    const qrCodePadding = spacings[RECEIVE_QR_CODE_PADDING] * 2;
    const horizontalOffset = cardHorizontalMargin + qrCodePadding;
    const qrCodeSize = Math.max(
        1,
        Math.min(
            MAX_RECEIVE_QR_CODE_SIZE,
            windowHeight * MAX_RECEIVE_QR_CODE_HEIGHT_RATIO,
            contentWidth - horizontalOffset,
        ),
    );

    return (
        <VStack
            spacing="sp24"
            flex={1}
            onLayout={event => setContentWidth(event.nativeEvent.layout.width)}
        >
            <Box marginHorizontal="sp8" marginTop="sp8" alignItems="center">
                {contentWidth > 0 && (
                    <ReceiveQRCodeCard
                        address={address}
                        networkSymbol={networkSymbol}
                        tokenContract={tokenContract}
                        tokenSymbol={tokenSymbol}
                        qrCodeSize={qrCodeSize}
                        onCopyAddress={handleCopyAddress}
                    />
                )}
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
                {contentWidth > 0 && (
                    <ClipboardCopyMenu
                        onCopy={handleCopyAddress}
                        style={applyStyle(addressContainer)}
                    >
                        <Box style={applyStyle(addressStyle, { width: contentWidth })}>
                            <AddressFormatter
                                value={address}
                                format="full"
                                variant="headline-sm"
                                textAlign="center"
                                testID="@receive/confirmed-receive-address"
                            />
                        </Box>
                    </ClipboardCopyMenu>
                )}
            </VStack>
        </VStack>
    );
};
