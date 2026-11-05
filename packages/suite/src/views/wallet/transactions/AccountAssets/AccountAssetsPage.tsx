import { selectFullSelectedAccount } from '@suite/account';
import {
    selectAccountTransactionsWithNulls,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';
import { getOlderHistoryFrom, isDirectRpcHistoryUnscanned } from '@suite-common/wallet-utils';

import { WalletLayout } from 'src/components/wallet';
import { SolanaLimitedHistoryBanner } from 'src/components/wallet/WalletLayout/AccountBanners/SolanaLimitedHistoryBanner';
import { useSelector } from 'src/hooks/suite';

import { AccountAssetOverview } from './AccountAssetOverview';
import { CardanoNewProviderCard } from '../../staking/components/AdaStakingDashboard/CardanoNewProviderCard';
import { SingleAccountTransactionList } from '../TransactionList/SingleAccountTransactionList';
import { Transactions } from '../Transactions';
import { AccountEmpty } from '../components/AccountEmpty';
import { NoTransactions } from '../components/NoTransactions';
import { TronResources } from '../components/TronResources';

/** The account's overview with the asset-first Home: its assets as Home lists the wallet's, then its history. */
export const AccountAssetsPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const accountKey = selectedAccount.account?.key || null;
    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, accountKey),
    );
    const accountTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    // A Privacy account keeps the overview it had: its mixing surface lives in the Coinjoin tab.
    if (account.backendType === 'coinjoin') {
        return <Transactions />;
    }

    // A direct-RPC backend has only scanned a recent window, or nothing yet, so an empty list is not
    // proof that history is unavailable: the list shows the progress and the way further back.
    const hasDirectRpcHistoryToLoad =
        !account.empty &&
        (isDirectRpcHistoryUnscanned(account) || getOlderHistoryFrom(account) !== undefined);
    const hasHistory =
        accountTransactions.length > 0 || transactionsIsLoading || hasDirectRpcHistoryToLoad;

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
