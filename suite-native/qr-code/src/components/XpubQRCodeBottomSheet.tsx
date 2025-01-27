import { useState } from 'react';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { BottomSheet, BottomSheetProps, Box, Button, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { XpubQRCodeCard } from './XpubQRCodeCard';

type XpubQRCodeBottomSheetProps = Pick<BottomSheetProps, 'isVisible'> & {
    onClose: () => void;
    qrCodeData?: string;
    symbol: NetworkSymbol;
};

const buttonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
}));

export const XpubQRCodeBottomSheet = ({
    isVisible,
    onClose,
    qrCodeData,
    symbol,
}: XpubQRCodeBottomSheetProps) => {
    const { translate } = useTranslate();
    const networkType = getNetworkType(symbol);
    const isAddressBased = isAddressBasedNetwork(networkType);
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();
    const [isXpubShown, setIsXpubShown] = useState(isAddressBased);

    if (!qrCodeData) return null;

    const copyMessage = translate(
        isAddressBased
            ? 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.address.copyMessage'
            : 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.copyMessage',
    );

    const showButtonTitle = (
        <Translation
            id={
                isAddressBased
                    ? 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.address.showButton'
                    : 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton'
            }
        />
    );
    const sheetTitle = (
        <Translation
            id={
                isAddressBased
                    ? 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.address.title'
                    : 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.title'
            }
        />
    );

    const handleShowXpub = () => {
        setIsXpubShown(true);
    };

    const handleCopyXpub = async () => {
        await copyToClipboard(qrCodeData, copyMessage);
        onClose();
    };

    return (
        <BottomSheet title={sheetTitle} isVisible={isVisible} onClose={onClose}>
            <VStack spacing="sp24">
                <XpubQRCodeCard isXpubShown={isXpubShown} qrCodeData={qrCodeData} />

                <Box style={applyStyle(buttonStyle)}>
                    {isXpubShown ? (
                        <Button size="large" onPress={handleCopyXpub}>
                            <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.copyButton" />
                        </Button>
                    ) : (
                        <Button size="large" viewLeft="eye" onPress={handleShowXpub}>
                            {showButtonTitle}
                        </Button>
                    )}
                </Box>
            </VStack>
        </BottomSheet>
    );
};
