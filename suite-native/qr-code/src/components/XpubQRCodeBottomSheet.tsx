import { useState } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceInViewOnlyMode, selectSelectedDevice } from '@suite-common/device';
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
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { XpubQRCodeCard } from './XpubQRCodeCard';
import { XpubUnverifiedWarning } from './XpubUnverifiedWarning';
import { XpubViewOnlyWarning } from './XpubViewOnlyWarning';

const USER_CANCELLED_ERROR_CODES = [
    'Failure_ActionCancelled',
    'Failure_PinCancelled',
    'Failure_PinInvalid',
    'Method_Cancel',
    'Method_Interrupted',
];

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
    const { showToast } = useToast();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const isImported = account?.imported ?? false;
    const [isXpubShown, setIsXpubShown] = useState(isImported);
    const [isViewOnlyWarningShown, setIsViewOnlyWarningShown] = useState(false);
    const [isXpubUnverified, setIsXpubUnverified] = useState(false);

    if (!qrCodeData) return null;

    const handleCancelConfirmation = () => {
        if (!confirmationInProgress) return;

        setConfirmationInProgress(false);
        TrezorConnect.cancel();
    };

    const handleShowXpub = async () => {
        if (!device || !account) return;

        if (!isImported && isDeviceInViewOnlyMode) {
            setIsViewOnlyWarningShown(true);

            return;
        }

        setConfirmationInProgress(true);
        const xpubResponse = await showXpubOnDevice(device, account);

        if (xpubResponse.success) {
            setIsXpubShown(true);
        } else {
            if (!USER_CANCELLED_ERROR_CODES.includes(xpubResponse.error.code ?? '')) {
                showToast({
                    intent: 'critical',
                    message: xpubResponse.error.message,
                    icon: 'warningCircle',
                });
            }
            onClose();
        }

        setConfirmationInProgress(false);
    };

    const handleShowUnverifiedXpub = () => {
        setIsViewOnlyWarningShown(false);
        setIsXpubUnverified(true);
        setIsXpubShown(true);
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
            {isViewOnlyWarningShown ? (
                <XpubViewOnlyWarning
                    onContinue={handleShowUnverifiedXpub}
                    onBack={() => setIsViewOnlyWarningShown(false)}
                />
            ) : (
                <VStack spacing="sp24">
                    {isXpubUnverified && <XpubUnverifiedWarning />}
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
            )}
        </BottomSheetModal>
    );
};
