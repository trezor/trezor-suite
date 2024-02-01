import { useState } from 'react';
import { useSelector } from 'react-redux';

import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';
import { Button } from '@suite-native/atoms';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

export const AccountSettingsShowXpubButton = ({ accountKey }: { accountKey: string }) => {
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const [isXpubVisible, setIsXpubVisible] = useState(false);

    if (!account) return null;

    const handleClose = () => {
        setIsXpubVisible(false);
    };
    const isAddressBased = isAddressBasedNetwork(account.networkType);

    const buttonTitle = isAddressBased
        ? translate(
              'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.address.showButton',
          )
        : translate(
              'moduleAccountManagement.accountSettingsScreen.xpubBottomSheet.xpub.showButton',
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
                networkSymbol={account.symbol}
                qrCodeData={account.descriptor}
            />
        </>
    );
};
