import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceBackupRequired, selectSelectedDevice } from '@suite-common/device';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { Button, useBottomSheetModal } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { SUITE_MOBILE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import { WalletBackupNotSetWarningBottomSheet } from '@suite-native/module-device-onboarding';
import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';
import { convertTaprootXpub } from '@trezor/utils';

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
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: () => openLink(SUITE_MOBILE_SUPPORT_URL),
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                secondaryButtonVariant: 'redElevation0',
            }),
        [openLink, showAlert, translate],
    );

    if (!account) return null;

    // Suite uses apostrophe in Taproot descriptors but FW uses 'h' – make sure they match.
    const accountXpub =
        convertTaprootXpub({ xpub: account.descriptor, direction: 'apostrophe-to-h' }) ??
        account.descriptor;

    const isAddressBased = isAddressBasedNetwork(account.networkType);

    const buttonTitle = (
        <Translation
            id={
                isAddressBased
                    ? 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.address.showButton'
                    : 'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton'
            }
        />
    );

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
                size="large"
                onPress={
                    hasFirmwareAuthenticityCheckHardFailed
                        ? showFirmwareAuthenticityCheckAlert
                        : showXpub
                }
                colorScheme="tertiaryElevation0"
            >
                {buttonTitle}
            </Button>
            <XpubQRCodeBottomSheet
                ref={xpubQRSheetRef}
                onClose={closeXpubQRSheet}
                symbol={account.symbol}
                qrCodeData={accountXpub}
                accountKey={accountKey}
            />
        </>
    );
};
