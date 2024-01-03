import { useSelector } from 'react-redux';

import { BottomSheet } from '@suite-native/atoms';
import { selectNetworkAccountsGroupedByAccountType } from '@suite-native/accounts';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountsRootState, DeviceRootState } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { GroupedAccountsList } from '@suite-native/accounts/src/components/GroupedAccountsList';

type NetworkAssetsBottomSheetProps = {
    networkSymbol: NetworkSymbol;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
    onClose: () => void;
};

export const NetworkAssetsBottomSheet = ({
    networkSymbol,
    onSelectAccount,
    onClose,
}: NetworkAssetsBottomSheetProps) => {
    const groupedNetworkAccounts = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectNetworkAccountsGroupedByAccountType(state, networkSymbol),
    );

    return (
        <BottomSheet title="Select Account" isVisible onClose={onClose}>
            <GroupedAccountsList
                groupedAccounts={groupedNetworkAccounts}
                onSelectAccount={onSelectAccount}
            />
        </BottomSheet>
    );
};
