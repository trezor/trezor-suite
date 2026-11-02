import { type Dispatch, type SetStateAction, useCallback, useEffect } from 'react';

import { useTranslation } from '@suite/intl';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Icon, Input } from '@trezor/components';
import { Row } from '@trezor/components/src/components/Flex/Flex';
import { useServices } from '@trezor/dependency-injection';
import { MagnifyingGlassIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { setTransactionHistoryPrefill } from 'src/actions/suite/suiteActions';
import { useSelector } from 'src/hooks/suite';
import { selectTransactionHistoryPrefill } from 'src/selectors/suite/suiteSelectors';

import { ExportAction } from './ExportAction';
import { FilterAction } from './FilterAction';

interface TransactionListActionsProps {
    accounts: readonly Account[];
    symbol: NetworkSymbol;
    searchQuery: string;
    setSearch: (query: string) => void;
    setSelectedPage: Dispatch<SetStateAction<number>>;
    isExportable?: boolean;
    isTxFilteringEnabled?: boolean;
}

export const TransactionListActions = ({
    accounts,
    symbol,
    searchQuery,
    setSearch,
    setSelectedPage,
    isExportable = true,
    isTxFilteringEnabled = true,
}: TransactionListActionsProps) => {
    const [singleAccount] = accounts;

    const transactionHistoryPrefill = useSelector(selectTransactionHistoryPrefill);

    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const onSearch = useCallback(
        (query: string) => {
            setSelectedPage(1);
            setSearch(query);
        },
        [setSearch, setSelectedPage],
    );

    useEffect(() => {
        if (transactionHistoryPrefill) {
            onSearch(transactionHistoryPrefill);
            dispatch(setTransactionHistoryPrefill(''));
        }
    }, [transactionHistoryPrefill, onSearch, dispatch]);

    return (
        <Row gap={12}>
            <Input
                data-testid="@wallet/accounts/search-icon"
                placeholder={translationString('TR_SEARCH_TRANSACTIONS')}
                value={searchQuery}
                onChange={event => onSearch(event.target.value)}
                onClear={() => setSearch('')}
                size="small"
                leftContent={
                    <Icon
                        as={MagnifyingGlassIcon}
                        intent="neutral"
                        priority="secondary"
                        size={16}
                    />
                }
            />
            {isTxFilteringEnabled && hasNetworkPotentialFraudTransactions(symbol) && (
                <FilterAction symbol={symbol} />
            )}
            {isExportable && accounts.length === 1 && singleAccount && (
                <ExportAction account={singleAccount} searchQuery={searchQuery} />
            )}
        </Row>
    );
};
