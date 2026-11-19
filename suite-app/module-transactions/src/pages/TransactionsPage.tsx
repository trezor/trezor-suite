import { type ReactNode } from 'react';

import { type SelectedAccountState, selectFullSelectedAccount } from '@suite/account';
import {
    selectAccountTransactionsWithNulls,
    selectHasAccountHistory,
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

export const TransactionsPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const accountKey = selectedAccount.account?.key || null;
    const accountTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );
    const hasHistory = useSelector(state => selectHasAccountHistory(state, accountKey));

    if (selectedAccount.status !== 'loaded') {
        return <Layout selectedAccount={selectedAccount} />;
    }

    const { account } = selectedAccount;

    const isGraphSupported = isNetworkWithGraphFeature(account.symbol, account.backendType);

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

    if (hasHistory) {
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
                <SingleAccountTransactionList account={account} symbol={account.symbol} />
            </Layout>
        );
    }

    if (account.empty) {
        return (
            <Layout selectedAccount={selectedAccount}>
                <Column gap={20}>
                    <AccountOverviewBalance selectedAccount={selectedAccount} />
                    <AccountEmpty account={selectedAccount.account} />
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
