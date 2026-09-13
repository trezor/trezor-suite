import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceBackupRequired, selectSelectedDevice } from '@suite-common/device';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFirmwareDescriptor } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { Button, useBottomSheetModal } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import { WalletBackupNotSetWarningBottomSheet } from '@suite-native/module-device-onboarding';
import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';

export const AccountSettingsShowXpubButton = ({ accountKey }: { accountKey: AccountKey }) => {
    const openLink = useOpenLink();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const {
        bottomSheetRef: walletBackupWarningSheetRef,
        openModal: openWalletBackupWarningSheet,
        closeModal: closeWalletBackupWarningSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: xpubQRSheetRef,
        openModal: openXpubQRSheet,
        closeModal: closeXpubQRSheet,
    } = useBottomSheetModal();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const device = useSelector(selectSelectedDevice);

    const showXpub = useCallback(() => {
        if (!device || !account) return;

        if (isDeviceBackupRequired) {
            openWalletBackupWarningSheet();
        } else {
            openXpubQRSheet();
        }
    }, [device, account, isDeviceBackupRequired, openWalletBackupWarningSheet, openXpubQRSheet]);

    const showFirmwareAuthenticityCheckAlert = useCallback(
        () =>
            showAlert({
                title: translate('generic.banners.deviceDanger.compromised.title'),
                description: translate('generic.banners.deviceDanger.compromised.subtitle'),
                icon: 'warning',
                primaryButtonTitle: translate('generic.banners.deviceDanger.compromised.cta'),
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: () => openLink(SUITE_MOBILE_SUPPORT_URL),
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            }),
        [openLink, showAlert, translate],
    );

    if (!account) return null;

    // Firmware shows taproot descriptors with 'h' where Suite stores '; match it for the QR code.
    const accountXpub = getFirmwareDescriptor(account);

    return (
        <>
            {isDeviceBackupRequired && (
                <WalletBackupNotSetWarningBottomSheet
                    onConfirm={() => {
                        openXpubQRSheet();
                        closeWalletBackupWarningSheet();
                    }}
                    onClose={closeWalletBackupWarningSheet}
                    ref={walletBackupWarningSheetRef}
                />
            )}
            <Button
                onPress={
                    hasFirmwareAuthenticityCheckHardFailed
                        ? showFirmwareAuthenticityCheckAlert
                        : showXpub
                }
                intent="neutral"
                priority="secondary"
            >
                <Translation id="moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton" />
            </Button>
            <XpubQRCodeBottomSheet
                ref={xpubQRSheetRef}
                onClose={closeXpubQRSheet}
                qrCodeData={accountXpub}
                accountKey={accountKey}
            />
        </>
    );
};
