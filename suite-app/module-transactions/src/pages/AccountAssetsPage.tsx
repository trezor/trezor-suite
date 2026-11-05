import { selectFullSelectedAccount } from '@suite/account';
import { selectHasAccountHistory } from '@suite-common/wallet-core';
import {
    AccountAssetOverview,
    AccountEmpty,
    CardanoNewProviderCard,
    NoTransactions,
    SingleAccountTransactionList,
    SolanaLimitedHistoryBanner,
    TronResources,
    WalletLayout,
    useSelector,
} from '@trezor/suite';

import { TransactionsPage } from './TransactionsPage';

/** The account's overview with the asset-first Home: its assets as Home lists the wallet's, then its history. */
export const AccountAssetsPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const hasHistory = useSelector(state =>
        selectHasAccountHistory(state, selectedAccount.account?.key || null),
    );

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    // A Privacy account keeps the overview it had: its mixing surface lives in the Coinjoin tab.
    if (account.backendType === 'coinjoin') {
        return <TransactionsPage />;
    }

    return (
        <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount}>
            {hasHistory && (
                <>
                    <CardanoNewProviderCard account={account} />
                    <TronResources account={account} />
                </>
            )}
            <AccountAssetOverview accountKey={account.key} />
            {hasHistory && (
                <>
                    <SolanaLimitedHistoryBanner account={account} />
                    <SingleAccountTransactionList account={account} symbol={account.symbol} />
                </>
            )}
            {!hasHistory &&
                (account.empty ? (
                    <AccountEmpty account={account} />
                ) : (
                    <NoTransactions account={account} />
                ))}
        </WalletLayout>
    );
};
