import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react';

import { useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Icon, Input } from '@trezor/components';
import { Row } from '@trezor/components/src/components/Flex/Flex';

import { SUITE } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { ExportAction } from './ExportAction';
import { FilterAction } from './FilterAction';

interface TransactionListActionsProps {
    account: Account;
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
    isExportable?: boolean;
    isTxFilteringEnabled?: boolean;
}

export const TransactionListActions = ({
    account,
    searchQuery,
    setSearch,
    setSelectedPage,
    isExportable = true,
    isTxFilteringEnabled = true,
}: TransactionListActionsProps) => {
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
        <Row gap={12}>
            <Input
                data-testid="@wallet/accounts/search-icon"
                placeholder={translationString('TR_SEARCH_TRANSACTIONS')}
                value={searchQuery}
                onChange={event => setSearch(event.target.value)}
                onClear={() => setSearch('')}
                size="small"
                leftContent={
                    <Icon name="magnifyingGlass" intent="neutral" priority="secondary" size={16} />
                }
            />
            {isTxFilteringEnabled && hasNetworkPotentialFraudTransactions(account.symbol) && (
                <FilterAction />
            )}
            {isExportable && <ExportAction account={account} searchQuery={searchQuery} />}
        </Row>
    );
};
