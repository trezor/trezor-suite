import { useEffect, useMemo } from 'react';

import { Translation } from '@suite/intl';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { toTokenAddress } from '@suite-common/tokens';
import {
    fetchAllTransactionsForAccountThunk,
    getYieldVaultContractAddress,
    selectAccountTransactionsWithNulls,
    selectAccountYieldVaultTransactions,
    selectAreAllTransactionsLoaded,
    selectIsAccountTransactionPhishing,
    selectIsHideSuspiciousTransactions,
} from '@suite-common/wallet-core';
import { getOlderHistoryFrom, isPending } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { EmptyListMessage } from '#src/views/wallet/transactions/TransactionList/EmptyListMessage';
import { TransactionList } from '#src/views/wallet/transactions/TransactionList/TransactionList';

import { useYieldVaultDetail } from './useYieldVaultDetail';

export const YieldVaultDetailTransactions = () => {
    const { dispatch } = useServices(injectDispatch);

    const { account, vault } = useYieldVaultDetail();

    const accountKey = account.key;
    const vaultContract = getYieldVaultContractAddress(vault);

    const areAllTransactionsLoaded = useSelector(
        state => selectAreAllTransactionsLoaded(state, accountKey) ?? false,
    );

    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );

    const allVaultTransactions = useSelector(state =>
        vaultContract
            ? selectAccountYieldVaultTransactions(state, accountKey, toTokenAddress(vaultContract))
            : [],
    );

    const isHidingSuspicious = useSelector(
        state =>
            hasNetworkPotentialFraudTransactions(account.symbol) &&
            selectIsHideSuspiciousTransactions(state, account.symbol),
    );
    const isAccountTransactionPhishing = useSelector(selectIsAccountTransactionPhishing);

    const vaultTransactions = useMemo(
        () =>
            isHidingSuspicious
                ? allVaultTransactions.filter(
                      transaction => !isAccountTransactionPhishing(accountKey, transaction),
                  )
                : allVaultTransactions,
        [isHidingSuspicious, allVaultTransactions, isAccountTransactionPhishing, accountKey],
    );

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    // The list adds pending transactions to the total itself, like account.history.total.
    const confirmedVaultTransactionsCount = useMemo(
        () => vaultTransactions.filter(transaction => !isPending(transaction)).length,
        [vaultTransactions],
    );

    // A direct-RPC backend scans only a recent block window, so an empty
    // list there still needs the control that reaches older history.
    const hasOlderHistory = getOlderHistoryFrom(account) !== undefined;

    if (allVaultTransactions.length === 0 && !hasOlderHistory) {
        return null;
    }

    return (
        <TransactionList
            key={accountKey}
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            allTransactions={allTransactions}
            account={account}
            transactions={vaultTransactions}
            symbol={account.symbol}
            isLoading={!areAllTransactionsLoaded}
            customTotalItems={confirmedVaultTransactionsCount}
            customHeading={<Translation id="TR_ALL_TRANSACTIONS" />}
            isExportable={false}
            customNoTransactions={
                hasOlderHistory ? <EmptyListMessage id="TR_NO_RECENT_TRANSACTIONS" /> : undefined
            }
        />
    );
};
