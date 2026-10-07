import { useMemo } from 'react';

import {
    findChainTransaction,
    useChainAccountTransactions,
    useChainHistoricRates,
    useSelectedChainNetworks,
} from '@suite-common/chain-data';
import {
    type TransactionsByAccount,
    selectAllPendingTransactions,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import type {
    Account,
    RatesByTimestamps,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import {
    enhanceChainTransactions,
    useHistoricRateCurrencies,
    useIsHistoryQueryOwned,
} from './useAccountTransactionsSource';
import { useLegacyPortfolioAccounts } from './useLegacyPortfolioAccounts';

export type AccountTransactionLookup = {
    transaction: WalletAccountTransaction | null;

    /** Past rates to value it at; `null` keeps the rates the wallet stores. */
    historicRates: RatesByTimestamps | null;

    /** Pending transactions of every account, this one's included, to find chained ones. */
    pendingTransactions: TransactionsByAccount;
};

const NO_ACCOUNTS: readonly Account[] = [];

/**
 * One transaction of an account, for views opened by txid (detail, notifications). With the
 * account's history read through chain networks it comes from the loaded history, and from the
 * store only while the wallet just sent it; otherwise from the store.
 */
export const useAccountTransaction = (
    account: Account | undefined,
    txid: string,
): AccountTransactionLookup => {
    const isQueryOwned = useIsHistoryQueryOwned(account);
    const networks = useSelectedChainNetworks();
    const currencies = useHistoricRateCurrencies();

    const legacyAccounts = useMemo(() => (account ? [account] : NO_ACCOUNTS), [account]);
    const { accounts } = useLegacyPortfolioAccounts(legacyAccounts);
    const ref = accounts[0]?.chainAccounts[0] ?? null;
    const network = networks.find(({ symbol }) => symbol === ref?.symbol);

    const history = useChainAccountTransactions({ network, ref, enabled: isQueryOwned });
    const historicRates = useChainHistoricRates({
        network,
        pages: history.pages,
        currencies,
        enabled: isQueryOwned,
    });

    const storedTransaction = useSelector(state =>
        account ? selectTransactionByAccountKeyAndTxid(state, account.key, txid) : null,
    );
    const storedPending = useSelector(selectAllPendingTransactions);

    return useMemo(() => {
        if (!isQueryOwned || !account) {
            return {
                transaction: storedTransaction ?? null,
                historicRates: null,
                pendingTransactions: storedPending,
            };
        }

        const addresses = history.pages[0]?.addresses;
        const loaded = findChainTransaction(history.pages, txid);
        const transaction = loaded
            ? enhanceChainTransactions([loaded], account, addresses)[0]
            : storedTransaction;

        const loadedPending = enhanceChainTransactions(
            history.transactions.filter(isPending),
            account,
            addresses,
        );
        const loadedTxids = new Set(loadedPending.map(pending => pending.txid));
        const justSent = (storedPending[account.key] ?? []).filter(
            pending => pending.deadline !== undefined && !loadedTxids.has(pending.txid),
        );

        return {
            transaction: transaction ?? null,
            historicRates,
            pendingTransactions: {
                ...storedPending,
                [account.key]: [...justSent, ...loadedPending],
            },
        };
    }, [
        isQueryOwned,
        account,
        txid,
        history.pages,
        history.transactions,
        historicRates,
        storedTransaction,
        storedPending,
    ]);
};
