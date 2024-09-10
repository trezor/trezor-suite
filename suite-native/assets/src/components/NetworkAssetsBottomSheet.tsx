import { useSelector } from 'react-redux';
import React from 'react';

import { BottomSheet } from '@suite-native/atoms';
import {
    OnSelectAccount,
    selectDeviceNetworkAccountsGroupedByAccountType,
} from '@suite-native/accounts';
import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { GroupedByTypeAccountsList } from '@suite-native/accounts';

type NetworkAssetsBottomSheetProps = {
    networkSymbol: NetworkSymbol;
    onSelectAccount: OnSelectAccount;
    onClose: () => void;
};

export const NetworkAssetsBottomSheet = React.memo(
    ({ networkSymbol, onSelectAccount, onClose }: NetworkAssetsBottomSheetProps) => {
        const groupedNetworkAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
            selectDeviceNetworkAccountsGroupedByAccountType(state, networkSymbol),
        );

        return (
            <BottomSheet title="Select Account" isVisible onClose={onClose}>
                <GroupedByTypeAccountsList
                    groupedAccounts={groupedNetworkAccounts}
                    onSelectAccount={onSelectAccount}
                />
            </BottomSheet>
        );
    },
);
