import { type ReactNode } from 'react';

import { type SelectedAccountState, selectFullSelectedAccount } from '@suite/account';
import {
    selectAccountTransactionsWithNulls,
    selectIsAccountTransactionListShown,
} from '@suite-common/wallet-core';
import { Column } from '@trezor/components';
import {
    AccountEmpty,
    AccountOverviewBalance,
    CardanoNewProviderCard,
    CoinjoinAccountDiscoveryProgress,
    NoTransactions,
    SingleAccountTransactionList,
    SolanaLimitedHistoryBanner,
    TradeBox,
    TransactionSummary,
    TronResources,
    WalletLayout,
    isNetworkWithGraphFeature,
    useSelector,
} from '@trezor/suite';

interface LayoutProps {
    selectedAccount: SelectedAccountState;
    children?: ReactNode;
}

const Layout = ({ selectedAccount, children }: LayoutProps) => (
    <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount}>
        {children}
    </WalletLayout>
);

type TransactionsPageTopProps = {
    selectedAccount: Extract<SelectedAccountState, { status: 'loaded' }>;
};

/** The top of the page as it was: the balance, the graph where the network has one, the trade box. */
const TransactionsPageTop = ({ selectedAccount }: TransactionsPageTopProps) => {
    const { account } = selectedAccount;

    if (isNetworkWithGraphFeature(account.symbol, account.backendType)) {
        return (
            <>
                <Column gap={20}>
                    <AccountOverviewBalance selectedAccount={selectedAccount} />
                    <TransactionSummary account={account} />
                </Column>
                <TradeBox account={account} />
            </>
        );
    }

    return (
        <Column gap={20}>
            <AccountOverviewBalance selectedAccount={selectedAccount} />
            <TradeBox account={account} />
        </Column>
    );
};

type TransactionsPageProps = {
    /**
     * Takes the place of the balance, the graph and the trade box at the top of the page: the
     * asset-first overview. A Privacy account keeps the overview it had either way.
     */
    topSection?: ReactNode;
};

export const TransactionsPage = ({ topSection }: TransactionsPageProps) => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const accountKey = selectedAccount.account?.key || null;
    const accountTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );
    const isTransactionListShown = useSelector(state =>
        selectIsAccountTransactionListShown(state, accountKey),
    );

    if (selectedAccount.status !== 'loaded') {
        return <Layout selectedAccount={selectedAccount} />;
    }

    const { account } = selectedAccount;

    if (account.backendType === 'coinjoin') {
        const isLoading = account.status === 'out-of-sync' && !!account.syncing;
        const isEmpty = !accountTransactions.length;

        if (isLoading) {
            return (
                <Layout selectedAccount={selectedAccount}>
                    <CoinjoinAccountDiscoveryProgress />
                </Layout>
            );
        }

        // The whole mixing surface lives in the Coinjoin tab, so the Privacy account overview is a
        // plain balance and history. Trading is unavailable for the account type, so neither the TradeBox nor the
        // graph (absent from the account type features) is rendered here.
        return (
            <Layout selectedAccount={selectedAccount}>
                <Column gap={20}>
                    <AccountOverviewBalance selectedAccount={selectedAccount} />
                    {isEmpty && <AccountEmpty account={account} />}
                </Column>
                {!isEmpty && (
                    <SingleAccountTransactionList account={account} symbol={account.symbol} />
                )}
            </Layout>
        );
    }

    if (isTransactionListShown) {
        return (
            <Layout selectedAccount={selectedAccount}>
                <CardanoNewProviderCard account={account} />
                <TronResources account={account} />
                {topSection ?? <TransactionsPageTop selectedAccount={selectedAccount} />}
                <SolanaLimitedHistoryBanner account={account} />
                <SingleAccountTransactionList account={account} symbol={account.symbol} />
            </Layout>
        );
    }

    const emptyState = account.empty ? (
        <AccountEmpty account={account} />
    ) : (
        <NoTransactions account={account} />
    );

    if (topSection !== undefined) {
        return (
            <Layout selectedAccount={selectedAccount}>
                {topSection}
                {emptyState}
            </Layout>
        );
    }

    return (
        <Layout selectedAccount={selectedAccount}>
            <Column gap={20}>
                <AccountOverviewBalance selectedAccount={selectedAccount} />
                {emptyState}
            </Column>
            <TradeBox account={account} />
        </Layout>
    );
};
