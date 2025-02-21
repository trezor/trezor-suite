import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { AccountLabels } from '@suite-common/metadata-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components/src/components/Flex/Flex';
import { spacings } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { SearchAction } from 'src/components/wallet/SearchAction';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

import { ExportAction } from './ExportAction';
import { FilterAction } from './FilterAction';

interface TransactionListActionsProps {
    account: Account;
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
    accountMetadata: AccountLabels;
    isExportable?: boolean;
}

export const TransactionListActions = ({
    account,
    searchQuery,
    setSearch,
    setSelectedPage,
    accountMetadata,
    isExportable = true,
}: TransactionListActionsProps) => {
    const [isExpanded, setExpanded] = useState(false);
    const [hasFetchedAll, setHasFetchedAll] = useState(false);

    const transactionHistoryPrefill = useSelector(
        state => state.suite.prefillFields.transactionHistory,
    );

    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const onSearch = useCallback(
        async (query: string) => {
            setSelectedPage(1);
            setSearch(query);

            if (!hasFetchedAll) {
                setHasFetchedAll(true);

                try {
                    await dispatch(
                        fetchAllTransactionsForAccountThunk({
                            accountKey: account.key,
                            noLoading: true,
                        }),
                    );
                } catch {
                    dispatch(
                        notificationsActions.addToast({
                            type: 'error',
                            error: translationString('TR_SEARCH_FAIL'),
                        }),
                    );
                }
            }
        },
        [account, dispatch, hasFetchedAll, setSearch, setSelectedPage, translationString],
    );

    useEffect(() => {
        setHasFetchedAll(false);
        setExpanded(false);
        setSearch('');
    }, [account.symbol, account.index, account.accountType, setSearch]);

    useEffect(() => {
        if (transactionHistoryPrefill) {
            onSearch(transactionHistoryPrefill);
            setSearch(transactionHistoryPrefill);
            dispatch({
                type: SUITE.SET_TRANSACTION_HISTORY_PREFILL,
                payload: '',
            });
        }
    }, [transactionHistoryPrefill, setSearch, onSearch, account, dispatch]);

    return (
        <Row gap={spacings.xxs}>
            <SearchAction
                tooltipText="TR_TRANSACTIONS_SEARCH_TOOLTIP"
                placeholder="TR_SEARCH_TRANSACTIONS"
                isExpanded={isExpanded}
                searchQuery={searchQuery}
                setExpanded={setExpanded}
                setSearch={setSearch}
                onSearch={onSearch}
                data-testid="@wallet/accounts/search-icon"
            />
            {hasNetworkPotentialFraudTransactions(account.symbol) && <FilterAction />}
            {isExportable && (
                <ExportAction
                    account={account}
                    searchQuery={searchQuery}
                    accountMetadata={accountMetadata}
                />
            )}
        </Row>
    );
};
