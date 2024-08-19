import styled from 'styled-components';

import { SearchAction } from 'src/components/wallet/SearchAction';
import { ExportAction } from './ExportAction';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { AccountLabels } from '@suite-common/metadata-types';
import { SUITE } from 'src/actions/suite/constants';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

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
                } catch (err) {
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
        <Wrapper>
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
            {isExportable && (
                <ExportAction
                    account={account}
                    searchQuery={searchQuery}
                    accountMetadata={accountMetadata}
                />
            )}
        </Wrapper>
    );
};
