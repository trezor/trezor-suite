import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import {
    type AccountsRootState,
    selectAccountByKey,
    showXpubOnDevice,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
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
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { XpubQRCodeCard } from './XpubQRCodeCard';

type XpubQRCodeBottomSheetProps = {
    onClose: () => void;
    qrCodeData?: string;
    ref: BottomSheetModalRef;
    accountKey: AccountKey;
};

const buttonStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
}));

export const XpubQRCodeBottomSheet = ({
    onClose,
    qrCodeData,
    ref,
    accountKey,
}: XpubQRCodeBottomSheetProps) => {
    const [confirmationInProgress, setConfirmationInProgress] = useState(false);
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);

    const isImported = account?.imported ?? false;
    const [isXpubShown, setIsXpubShown] = useState(isImported);

    if (!qrCodeData) return null;

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
        const copyMessage = translate(
            'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.copyMessage',
        );
        await copyToClipboard(qrCodeData, copyMessage);
        onClose();
    };

    return (
        <BottomSheetModal
            ref={ref}
            isCloseDisplayed
            title={
                <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.title" />
            }
            onClose={handleCancelConfirmation}
        >
            <VStack spacing="sp24">
                <XpubQRCodeCard isXpubShown={isXpubShown} qrCodeData={qrCodeData} />

                <Box style={applyStyle(buttonStyle)}>
                    {isXpubShown ? (
                        <Button onPress={handleCopyXpub}>
                            <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.copyButton" />
                        </Button>
                    ) : (
                        <Button iconLeft="eye" onPress={handleShowXpub}>
                            <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton" />
                        </Button>
                    )}
                </Box>
            </VStack>
        </BottomSheetModal>
    );
};
