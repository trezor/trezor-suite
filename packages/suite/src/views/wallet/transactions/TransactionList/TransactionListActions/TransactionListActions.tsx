import styled from 'styled-components';

import { SearchAction } from 'src/components/wallet/SearchAction';
import { ExportAction } from './ExportAction';
import { ChangeEvent, Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useDispatch, useTranslation } from 'src/hooks/suite';
import { notificationsActions } from '@suite-common/toast-notifications';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { AccountLabels } from '@suite-common/metadata-types';

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

    const inputRef = useRef<HTMLInputElement | null>(null);
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const onSearch = useCallback(
        async ({ target }: ChangeEvent<HTMLInputElement>) => {
            setSelectedPage(1);
            setSearch(target.value);

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

    const onSearchKeys = useCallback(
        (event: KeyboardEvent) => {
            if (
                inputRef.current &&
                (event.ctrlKey || event.metaKey) &&
                event.key === KEYBOARD_CODE.LETTER_F
            ) {
                event.preventDefault();
                inputRef.current.focus();
            }
        },
        [inputRef],
    );

    useEffect(() => {
        setHasFetchedAll(false);
        setExpanded(false);
        setSearch('');

        document.addEventListener('keydown', onSearchKeys);

        return () => {
            document.removeEventListener('keydown', onSearchKeys);
        };
    }, [account.symbol, account.index, account.accountType, setSearch, onSearchKeys]);

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
                dataTest="@wallet/accounts/search-icon"
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
