import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    selectAccountByKey,
    showXpubOnDevice,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    VStack,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation, useTranslate } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { XpubQRCodeCard } from './XpubQRCodeCard';

type XpubQRCodeBottomSheetProps = {
    onClose: () => void;
    qrCodeData?: string;
    symbol: NetworkSymbol;
    ref: BottomSheetModalRef;
    accountKey: AccountKey;
};

const buttonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
}));

export const XpubQRCodeBottomSheet = ({
    onClose,
    qrCodeData,
    symbol,
    ref,
    accountKey,
}: XpubQRCodeBottomSheetProps) => {
    const [confirmationInProgress, setConfirmationInProgress] = useState(false);
    const { translate } = useTranslate();
    const networkType = getNetworkType(symbol);
    const isAddressBased = isAddressBasedNetwork(networkType);
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();
    const [isXpubShown, setIsXpubShown] = useState(isAddressBased);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const device = useSelector(selectSelectedDevice);

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

    const handleCancelConfirmation = () => {
        if (!confirmationInProgress) return;

        setConfirmationInProgress(false);
        TrezorConnect.cancel();
    };

    const handleShowXpub = async () => {
        if (!device || !account) return;

        setConfirmationInProgress(true);
        const xpubResponse = await showXpubOnDevice(device, account);

        if (xpubResponse.success) {
            setIsXpubShown(true);
        } else {
            onClose();
        }

        setConfirmationInProgress(false);
    };

    const handleCopyXpub = async () => {
        await copyToClipboard(qrCodeData, copyMessage);
        onClose();
    };

    return (
        <BottomSheetModal
            ref={ref}
            isCloseDisplayed
            title={sheetTitle}
            onClose={handleCancelConfirmation}
        >
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
        </BottomSheetModal>
    );
};
