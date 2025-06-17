import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    AccountsRootState,
    selectAccountByKey,
    selectIsDeviceBackupRequired,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getDerivationType, isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { Button, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { WalletBackupNotSetWarningBottomSheet } from '@suite-native/module-device-onboarding';
import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';
import TrezorConnect, { Success, Unsuccessful } from '@trezor/connect';
import { convertTaprootXpub } from '@trezor/utils';

export const showXpubOnDevice = async (device: TrezorDevice, account: Account) => {
    if (!device || !account) return;

    const params = {
        device,
        path: account.path,
        useEmptyPassphrase: device.useEmptyPassphrase,
        showOnTrezor: true,
        derivationType: getDerivationType(account.accountType),
        coin: account.symbol,
    };

    let response: Success<unknown> | Unsuccessful;
    switch (account.networkType) {
        case 'bitcoin':
            response = await TrezorConnect.getPublicKey(params);
            break;
        case 'cardano':
            response = await TrezorConnect.cardanoGetPublicKey(params);
            break;
        case 'solana':
            response = await TrezorConnect.solanaGetPublicKey(params);
            break;
        default:
            response = {
                success: false,
                payload: { error: 'Method for getPublicKey not defined', code: undefined },
            };
    }

    return response;
};

export const AccountSettingsShowXpubButton = ({ accountKey }: { accountKey: string }) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const [isXpubVisible, setIsXpubVisible] = useState(false);
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

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
            <Button size="large" onPress={showXpub} colorScheme="tertiaryElevation0">
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
