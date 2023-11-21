import { useState } from 'react';
import { useSelector } from 'react-redux';

import { XpubQRCodeBottomSheet } from '@suite-native/qr-code';
import { Button } from '@suite-native/atoms';
import { networks, NetworkType } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

const networkTypeToButtonTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Show public key (XPUB)',
    cardano: 'Show public key (XPUB)',
    ethereum: 'Show receive address',
    ripple: 'Show receive address',
    solana: 'Show receive address',
};

export const AccountSettingsShowXpubButton = ({ accountKey }: { accountKey: string }) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const [isXpubVisible, setIsXpubVisible] = useState(false);

    if (!account) return null;

    const handleClose = () => {
        setIsXpubVisible(false);
    };

    const { networkType } = networks[account.symbol];

    return (
        <>
            <Button
                size="large"
                onPress={() => setIsXpubVisible(true)}
                colorScheme="tertiaryElevation0"
            >
                {networkTypeToButtonTitleMap[networkType]}
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
