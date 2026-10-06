import { useEffect, useRef, useState } from 'react';
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
import {
    DeviceAuthorizationStep,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
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
    const showRequestIdRef = useRef(0);
    const isConfirmationPendingRef = useRef(false);
    const isTakenOverByDeviceAuthorizationRef = useRef(false);
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();
    const { showToast } = useToast();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const device = useSelector(selectSelectedDevice);
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);

    const isImported = account?.imported ?? false;
    const [isXpubShown, setIsXpubShown] = useState(isImported);
    const [isViewOnlyWarningShown, setIsViewOnlyWarningShown] = useState(false);
    const [isXpubUnverified, setIsXpubUnverified] = useState(false);
    const [isConfirmationPending, setIsConfirmationPending] = useState(false);

    const isDeviceAuthorizationActive =
        deviceAuthorizationStep !== DeviceAuthorizationStep.Idle && isConfirmationPending;

    // The passphrase/PIN screens are pushed UNDER the bottom sheet (sheets render in a root-level
    // portal), so the sheet has to yield to them and come back once the authorization finishes.
    // The in-flight request stays alive the whole time (handleDismiss skips the cancel).
    useEffect(() => {
        if (!ref || !('current' in ref)) return;

        if (isDeviceAuthorizationActive && !isTakenOverByDeviceAuthorizationRef.current) {
            isTakenOverByDeviceAuthorizationRef.current = true;
            ref.current?.dismiss();
        } else if (!isDeviceAuthorizationActive && isTakenOverByDeviceAuthorizationRef.current) {
            isTakenOverByDeviceAuthorizationRef.current = false;
            ref.current?.present();
        }
    }, [isDeviceAuthorizationActive, ref]);

    if (!qrCodeData) return null;

    const handleShowXpub = async () => {
        if (!device || !account || isConfirmationPendingRef.current) return;

        // Desktop parity: a device that is disconnected or unavailable (e.g. passphrase settings
        // changed since the wallet instance was created) cannot confirm the XPUB on-device.
        if (!isImported && (!device.connected || !device.available || isDeviceInViewOnlyMode)) {
            setIsViewOnlyWarningShown(true);

            return;
        }

        const requestId = ++showRequestIdRef.current;
        isConfirmationPendingRef.current = true;
        setIsConfirmationPending(true);

        let xpubResponse;
        try {
            xpubResponse = await showXpubOnDevice(device, account);
        } catch (error) {
            xpubResponse = {
                success: false as const,
                error: {
                    message: error instanceof Error ? error.message : String(error),
                    code: 'Failure_UnknownCode',
                },
            };
        }

        // A dismissal invalidated this request and already reset the sheet — the response
        // (even a successful one) must not touch the state anymore.
        if (showRequestIdRef.current !== requestId) return;

        isConfirmationPendingRef.current = false;
        setIsConfirmationPending(false);

        const wasTakenOverByDeviceAuthorization = isTakenOverByDeviceAuthorizationRef.current;
        isTakenOverByDeviceAuthorizationRef.current = false;

        if (xpubResponse.success) {
            setIsXpubShown(true);
            if (wasTakenOverByDeviceAuthorization && ref && 'current' in ref) {
                ref.current?.present();
            }
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

    // The sheet stays mounted across open/close cycles, so the revealed XPUB must be reset on
    // every dismissal — desktop parity, where each opening requires a new on-device confirmation.
    const handleDismiss = () => {
        // The sheet only yielded to the passphrase/PIN screen — the request stays alive and the
        // sheet re-presents itself once the authorization finishes.
        if (isTakenOverByDeviceAuthorizationRef.current) return;

        showRequestIdRef.current += 1;
        if (isConfirmationPendingRef.current) {
            isConfirmationPendingRef.current = false;
            TrezorConnect.cancel();
        }
        setIsConfirmationPending(false);
        setIsXpubShown(isImported);
        setIsViewOnlyWarningShown(false);
        setIsXpubUnverified(false);
    };

    return (
        <BottomSheetModal
            ref={ref}
            isCloseDisplayed
            title={
                <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.title" />
            }
            onDismiss={handleDismiss}
        >
            {isViewOnlyWarningShown ? (
                <XpubViewOnlyWarning
                    onContinue={handleShowUnverifiedXpub}
                    onBack={() => setIsViewOnlyWarningShown(false)}
                />
            ) : (
                <VStack spacing="sp24">
                    {isXpubUnverified && <XpubUnverifiedWarning />}
                    <XpubQRCodeCard
                        isXpubShown={isXpubShown || isConfirmationPending}
                        qrCodeData={qrCodeData}
                    />

                    <Box style={applyStyle(buttonStyle)}>
                        {isXpubShown ? (
                            <Button onPress={handleCopyXpub}>
                                <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.copyButton" />
                            </Button>
                        ) : (
                            <Button
                                iconLeft="eye"
                                onPress={handleShowXpub}
                                isLoading={isConfirmationPending}
                            >
                                <Translation
                                    id={
                                        isConfirmationPending
                                            ? 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.confirmOnTrezorButton'
                                            : 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton'
                                    }
                                />
                            </Button>
                        )}
                    </Box>
                </VStack>
            )}
        </BottomSheetModal>
    );
};
