import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type AssetAccount,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AssetAccountListItem } from '@suite-native/accounts';

type AssetDetailAccountListItemProps = {
    assetAccount: AssetAccount;
    onAccountPress: (accountKey: AccountKey) => void;
};

export const AssetDetailAccountListItem = ({
    assetAccount,
    onAccountPress,
}: AssetDetailAccountListItemProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, assetAccount.accountKey),
    );

    if (account === null) {
        return null;
    }

    return (
        <AssetAccountListItem
            account={account}
            assetAccount={assetAccount}
            onPress={({ account: selectedAccount }) => onAccountPress(selectedAccount.key)}
        />
    );
};
