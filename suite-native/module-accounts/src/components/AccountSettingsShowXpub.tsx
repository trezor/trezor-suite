import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { XpubQRCode } from '@suite-native/qr-code';
import { BottomSheet, Button } from '@suite-native/atoms';
import { networks, NetworkType } from '@suite-common/wallet-config';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

const networkTypeToButtonTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Show public key (XPUB)',
    cardano: 'Show public key (XPUB)',
    ethereum: 'Show receive address',
    ripple: 'Show receive address',
    solana: 'Show receive address',
};

const networkTypeToSheetTitleMap: Record<NetworkType, string> = {
    bitcoin: 'Public key (XPUB)',
    cardano: 'Public key (XPUB)',
    ethereum: 'Receive address',
    ripple: 'Receive address',
    solana: 'Receive address',
};

export const AccountSettingsShowXpub = ({ accountKey }: { accountKey: string }) => {
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
            <Button onPress={() => setIsXpubVisible(true)} colorScheme="tertiaryElevation0">
                {networkTypeToButtonTitleMap[networkType]}
            </Button>
            <BottomSheet
                title={networkTypeToSheetTitleMap[networkType]}
                isVisible={isXpubVisible}
                onClose={handleClose}
            >
                <XpubQRCode
                    data={account.descriptor}
                    onCopy={handleClose}
                    networkSymbol={account.symbol}
                />
            </BottomSheet>
        </>
    );
};
