import {
    selectWalletAssetAccounts,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { MultiAccountTransactionList } from 'src/views/wallet/transactions/TransactionList/MultiAccountTransactionList';

type AssetDetailTransactionsProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailTransactions = ({ assetKey }: AssetDetailTransactionsProps) => {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const accounts = useSelector(state => selectWalletAssetAccounts(state, assetKey));

    if (symbol === undefined || accounts.length === 0) {
        return null;
    }

    return (
        <MultiAccountTransactionList
            key={accounts.map(account => account.key).join('|')}
            accounts={accounts}
            symbol={symbol}
            contractAddress={contractAddress}
        />
    );
};
