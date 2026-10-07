import { type ReactNode } from 'react';

import { selectFullSelectedAccount } from '@suite/account';
import { Column } from '@trezor/components';

import { CoinjoinAccountDiscoveryProgress, WalletLayout } from 'src/components/wallet';
import { SolanaLimitedHistoryBanner } from 'src/components/wallet/WalletLayout/AccountBanners/SolanaLimitedHistoryBanner';
import { useSelector } from 'src/hooks/suite';
import { useAccountTransactionsSource } from 'src/hooks/wallet/chainData/useAccountTransactionsSource';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';

import { CoinjoinExplanation } from './CoinjoinExplanation/CoinjoinExplanation';
import { CoinjoinSummary } from './CoinjoinSummary/CoinjoinSummary';
import { TradeBox } from './TradeBox/TradeBox';
import { WalletTransactionList } from './TransactionList/WalletTransactionList';
import { AccountEmpty } from './components/AccountEmpty';
import { AccountOverviewBalance } from './components/AccountOverviewBalance';
import { NoTransactions } from './components/NoTransactions';
import { TransactionSummary } from './components/TransactionSummary';
import { TronResources } from './components/TronResources';
import { CardanoNewProviderCard } from '../staking/components/AdaStakingDashboard/CardanoNewProviderCard';

interface LayoutProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: ReactNode;
}

const Layout = ({ selectedAccount, children }: LayoutProps) => (
    <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount}>
        {children}
    </WalletLayout>
);

type AccountTransactionsProps = {
    selectedAccount: AppState['wallet']['selectedAccount'];
    account: Account;
};

const AccountTransactions = ({ selectedAccount, account }: AccountTransactionsProps) => {
    const source = useAccountTransactionsSource(account);
    const accountTransactions = source.transactions;
    const transactionsIsLoading = source.isLoading;

    const isGraphSupported = isNetworkWithGraphFeature(account.symbol, account.backendType);

    if (account.backendType === 'coinjoin') {
        const isLoading = account.status === 'out-of-sync' && !!account.syncing;
        const isEmpty = !accountTransactions.length;

        return (
            <Layout selectedAccount={selectedAccount}>
                {isLoading && <CoinjoinAccountDiscoveryProgress />}

                {!isLoading && (
                    <>
                        <CoinjoinSummary accountKey={account.key} />

                        {isEmpty ? (
                            <CoinjoinExplanation />
                        ) : (
                            <WalletTransactionList account={account} symbol={account.symbol} />
                        )}
                    </>
                )}
            </Layout>
        );
    }

    if (accountTransactions.length > 0 || transactionsIsLoading) {
        return (
            <Layout selectedAccount={selectedAccount}>
                <CardanoNewProviderCard account={account} />
                <TronResources account={account} />
                {isGraphSupported ? (
                    <>
                        <Column gap={20}>
                            <AccountOverviewBalance selectedAccount={selectedAccount} />
                            <TransactionSummary account={account} />
                        </Column>
                        <TradeBox account={account} />
                    </>
                ) : (
                    <Column gap={20}>
                        <AccountOverviewBalance selectedAccount={selectedAccount} />
                        <TradeBox account={account} />
                    </Column>
                )}
                <SolanaLimitedHistoryBanner account={account} />
                <WalletTransactionList account={account} symbol={account.symbol} />
            </Layout>
        );
    }

    if (account.empty) {
        return (
            <Layout selectedAccount={selectedAccount}>
                <Column gap={20}>
                    <AccountOverviewBalance selectedAccount={selectedAccount} />
                    <AccountEmpty account={account} />
                </Column>
                <TradeBox account={account} />
            </Layout>
        );
    }

    return (
        <Layout selectedAccount={selectedAccount}>
            <Column gap={20}>
                <AccountOverviewBalance selectedAccount={selectedAccount} />
                <NoTransactions account={account} />
            </Column>
            <TradeBox account={account} />
        </Layout>
    );
};

export const Transactions = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <Layout selectedAccount={selectedAccount} />;
    }

    return (
        <AccountTransactions selectedAccount={selectedAccount} account={selectedAccount.account} />
    );
};
