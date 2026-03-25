import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    Badge,
    Button,
    Column,
    Icon,
    Input,
    Popover,
    type PopoverRef,
    Row,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { SUITE } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { ExportAction } from './ExportAction';
import { FilterAction } from './FilterAction';
import { FilterChips } from './FilterChips';
import { SearchFilterPanel } from './SearchFilterPanel';
import {
    type ConditionLogic,
    type FilterCondition,
    type NewFilterCondition,
} from './useTransactionFilters';

interface TransactionListActionsProps {
    account: Account;
    searchQuery: string;
    setSearch: Dispatch<SetStateAction<string>>;
    setSelectedPage: Dispatch<SetStateAction<number>>;
    isExportable?: boolean;
    isTxFilteringEnabled?: boolean;
    conditions: FilterCondition[];
    logics: ConditionLogic[];
    onAddCondition: (condition: NewFilterCondition) => void;
    onUpdateCondition: (id: string, condition: NewFilterCondition) => void;
    onRemoveCondition: (id: string) => void;
    onToggleLogic: (index: number) => void;
    onClearConditions: () => void;
}

export const TransactionListActions = ({
    account,
    searchQuery,
    setSearch,
    setSelectedPage,
    isExportable = true,
    isTxFilteringEnabled = true,
    conditions,
    logics,
    onAddCondition,
    onUpdateCondition,
    onRemoveCondition,
    onToggleLogic,
    onClearConditions,
}: TransactionListActionsProps) => {
    const [hasFetchedAll, setHasFetchedAll] = useState(false);
    const [editingConditionId, setEditingConditionId] = useState<string | null>(null);
    const filterPopoverRef = useRef<PopoverRef>(undefined);

    const transactionHistoryPrefill = useSelector(
        state => state.suite.prefillFields.transactionHistory,
    );

    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const fetchAllIfNeeded = useCallback(() => {
        if (!hasFetchedAll) {
            setHasFetchedAll(true);
            dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey: account.key,
                    noLoading: true,
                }),
            );
        }
    }, [account.key, dispatch, hasFetchedAll]);

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

    const handleAddCondition = (condition: NewFilterCondition) => {
        onAddCondition(condition);
        setSelectedPage(1);
        fetchAllIfNeeded();
    };

    const handleUpdateCondition = (condition: NewFilterCondition) => {
        if (editingConditionId) {
            onUpdateCondition(editingConditionId, condition);
            setEditingConditionId(null);
        }
    };

    const handleEditCondition = (id: string) => {
        setEditingConditionId(id);
        filterPopoverRef.current?.open();
    };

    const handlePanelClose = () => {
        setEditingConditionId(null);
        filterPopoverRef.current?.close();
    };

    const editingCondition = editingConditionId
        ? conditions.find(c => c.id === editingConditionId)
        : undefined;

    const hasActiveFilters = conditions.length > 0;

    return (
        <Column gap={spacings.xs} alignItems="stretch">
            <Row gap={12}>
                <Input
                    data-testid="@wallet/accounts/search-icon"
                    placeholder={translationString('TR_SEARCH_TRANSACTIONS')}
                    value={searchQuery}
                    onChange={event => setSearch(event.target.value)}
                    onClear={() => setSearch('')}
                    size="small"
                    leftContent={
                        <Icon
                            name="magnifyingGlass"
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                />
                {isTxFilteringEnabled && (
                    <Popover
                        ref={filterPopoverRef}
                        content={
                            <SearchFilterPanel
                                onAdd={handleAddCondition}
                                onUpdate={handleUpdateCondition}
                                editingCondition={editingCondition}
                                onClose={handlePanelClose}
                                symbol={account.symbol}
                            />
                        }
                        placement={{ position: 'bottom', alignment: 'end' }}
                    >
                        <Button
                            size="medium"
                            intent={hasActiveFilters ? 'brand' : 'neutral'}
                            priority="secondary"
                            iconLeft="slidersHorizontal"
                            data-testid="@wallet/accounts/filter-button"
                        >
                            <Row gap={4} alignItems="center">
                                {translationString('TR_TX_FILTER_BUTTON')}
                                {hasActiveFilters && (
                                    <Badge size="small" intent="brand">
                                        {conditions.length}
                                    </Badge>
                                )}
                            </Row>
                        </Button>
                    </Popover>
                )}
                {isTxFilteringEnabled && hasNetworkPotentialFraudTransactions(account.symbol) && (
                    <FilterAction />
                )}
                {isExportable && <ExportAction account={account} searchQuery={searchQuery} />}
            </Row>
            {hasActiveFilters && (
                <FilterChips
                    conditions={conditions}
                    logics={logics}
                    onRemove={onRemoveCondition}
                    onToggleLogic={onToggleLogic}
                    onClearAll={onClearConditions}
                    onEditCondition={handleEditCondition}
                />
            )}
        </Column>
    );
};
