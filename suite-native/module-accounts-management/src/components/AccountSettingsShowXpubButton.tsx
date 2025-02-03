import { useState } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';
import { convertTaprootXpub } from '@trezor/utils';

export const AccountSettingsShowXpubButton = ({ accountKey }: { accountKey: string }) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const [isXpubVisible, setIsXpubVisible] = useState(false);

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
            <Button
                size="large"
                onPress={() => setIsXpubVisible(true)}
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
