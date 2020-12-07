import React, { useState, useCallback } from 'react';
import { Input } from '@trezor/components';
import { useActions } from '@suite-hooks';
import { useTranslation } from '@suite-hooks/useTranslation';
import * as notificationActions from '@suite-actions/notificationActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import { Account } from '@wallet-types';
import { isEnabled } from '@suite-utils/features';

export interface Props {
    account: Account;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    setSelectedPage: React.Dispatch<React.SetStateAction<number>>;
}

const SearchAction = ({ account, search, setSearch, setSelectedPage }: Props) => {
    const { translationString } = useTranslation();
    const { addToast, fetchAllTransactions } = useActions({
        addToast: notificationActions.addToast,
        fetchAllTransactions: transactionActions.fetchAllTransactions,
    });

    const [isSearchFetching, setIsSearchFetching] = useState(false);
    const onSearch = useCallback(
        async e => {
            const { value } = e.target;
            if (search === '' && value !== '') {
                // Fetch all transactions
                setIsSearchFetching(true);
                try {
                    await fetchAllTransactions(account);
                } catch (err) {
                    addToast({
                        type: 'error',
                        error: translationString('TR_EXPORT_FAIL'),
                    });
                } finally {
                    setIsSearchFetching(false);
                }
            }

            setSelectedPage(1);
            setSearch(value);
        },
        [
            account,
            addToast,
            fetchAllTransactions,
            search,
            setSearch,
            setSelectedPage,
            translationString,
        ],
    );

    if (!isEnabled('SEARCH_TRANSACTIONS')) {
        return null;
    }

    return <Input onChange={onSearch} value={search} isLoading={isSearchFetching} />;
};

export default SearchAction;
