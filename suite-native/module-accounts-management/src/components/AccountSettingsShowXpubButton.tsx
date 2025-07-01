import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    selectAccountByKey,
    selectIsDeviceBackupRequired,
    selectSelectedDevice,
    showXpubOnDevice,
} from '@suite-common/wallet-core';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { Button, useBottomSheetModal } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { SUITE_LITE_SUPPORT_URL, useOpenLink } from '@suite-native/link';
import { WalletBackupNotSetWarningBottomSheet } from '@suite-native/module-device-onboarding';
import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';
import { convertTaprootXpub } from '@trezor/utils';

export const AccountSettingsShowXpubButton = ({ accountKey }: { accountKey: string }) => {
    const openLink = useOpenLink();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const [isXpubVisible, setIsXpubVisible] = useState(false);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );

    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const device = useSelector(selectSelectedDevice);

    const showXpub = useCallback(() => {
        if (!device || !account) return;

        showXpubOnDevice(device, account);
        if (isDeviceBackupRequired) {
            openModal();
        } else {
            setIsXpubVisible(true);
        }
    }, [isDeviceBackupRequired, device, account, openModal]);

    const showFirmwareAuthenticityCheckAlert = useCallback(
        () =>
            showAlert({
                title: translate('generic.banners.deviceDanger.compromised.title'),
                description: translate('generic.banners.deviceDanger.compromised.subtitle'),
                icon: 'warning',
                primaryButtonTitle: translate('generic.banners.deviceDanger.compromised.cta'),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: () => openLink(SUITE_LITE_SUPPORT_URL),
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

    const handleClose = () => {
        setIsXpubVisible(false);
    };
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
                        setIsXpubVisible(true);
                        closeModal();
                    }}
                    onClose={handleClose}
                    ref={bottomSheetRef}
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
                isVisible={isXpubVisible}
                onClose={handleClose}
                symbol={account.symbol}
                qrCodeData={accountXpub}
            />
        </>
    );
};
