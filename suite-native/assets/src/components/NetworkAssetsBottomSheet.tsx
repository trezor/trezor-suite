import React from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { BottomSheet } from '@suite-native/atoms';
import { AccountsListGroup } from '@suite-native/accounts';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { selectAccountsByNetworkSymbol } from '@suite-common/wallet-core';

type NetworkAssetsBottomSheetProps = {
    networkSymbol: NetworkSymbol | null;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
    onClose: () => void;
};

export const NetworkAssetsBottomSheet = ({
    networkSymbol,
    onSelectAccount,
    onClose,
}: NetworkAssetsBottomSheetProps) => {
    const selectedAccounts = useSelector((state: any) =>
        selectAccountsByNetworkSymbol(state, networkSymbol),
    );

    if (G.isNull(networkSymbol)) return null;

    return (
        <BottomSheet title="Select Account" isVisible onClose={onClose}>
            {networkSymbol && (
                <AccountsListGroup accounts={selectedAccounts} onSelectAccount={onSelectAccount} />
            )}
        </BottomSheet>
    );
};
