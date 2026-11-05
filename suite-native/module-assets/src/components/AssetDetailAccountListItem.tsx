import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { AssetAccountListItem } from '@suite-native/accounts';

type AssetDetailAccountListItemProps = {
    accountKey: AccountKey;
    contractAddress: TokenAddress | undefined;
    onAccountPress: (accountKey: AccountKey) => void;
};

export const AssetDetailAccountListItem = ({
    accountKey,
    contractAddress,
    onAccountPress,
}: AssetDetailAccountListItemProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (account === null) {
        return null;
    }

    return (
        <AssetAccountListItem
            account={account}
            contractAddress={contractAddress}
            onPress={({ account: selectedAccount }) => onAccountPress(selectedAccount.key)}
        />
    );
};
