import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { BottomSheet } from '@suite-native/atoms';
import { AccountsListGroup } from '@suite-native/accounts';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    DeviceRootState,
    selectAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';

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
    const selectedAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectAccountsByNetworkSymbol(state, networkSymbol),
    );

    if (G.isNull(networkSymbol)) return null;

    return (
        <BottomSheet title="Select Account" isVisible onClose={onClose}>
            <AccountsListGroup accounts={selectedAccounts} onSelectAccount={onSelectAccount} />
        </BottomSheet>
    );
};
