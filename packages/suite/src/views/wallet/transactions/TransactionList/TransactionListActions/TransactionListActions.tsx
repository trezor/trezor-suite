import {
    type Dispatch,
    type SetStateAction,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
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
    ButtonGroup,
    IconButton,
    Popover,
    type PopoverRef,
    Row,
    Tooltip,
} from '@trezor/components';

import { SUITE } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { ExportAction } from './ExportAction';
import { FilterAction } from './FilterAction';
import { SearchFilterPanel } from './SearchFilterPanel';
import {
    type ConditionLogic,
    type FilterCondition,
    type NewFilterCondition,
    compileFilters,
} from './useTransactionFilters';

export type TransactionListActionsRef = {
    editCondition: (id: string) => void;
};

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
    onClearConditions: () => void;
}

export const TransactionListActions = forwardRef<
    TransactionListActionsRef,
    TransactionListActionsProps
>(
    (
        {
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
            onClearConditions,
        },
        ref,
    ) => {
        const compiledSearchQuery = compileFilters(conditions, logics, searchQuery);

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

        useImperativeHandle(ref, () => ({ editCondition: handleEditCondition }));

        const handlePanelClose = () => {
            setEditingConditionId(null);
            filterPopoverRef.current?.close();
        };

        const editingCondition = editingConditionId
            ? conditions.find(c => c.id === editingConditionId)
            : undefined;

        const hasActiveFilters = conditions.length > 0;

        return (
            <Row gap={12}>
                {/*<Input
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
                />*/}

                {isTxFilteringEnabled && (
                    <ButtonGroup size="medium">
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
                                iconLeft="slidersHorizontal"
                                data-testid="@wallet/accounts/filter-button"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Row gap={8} alignItems="center">
                                    {translationString('TR_TX_FILTER_BUTTON')}
                                    {hasActiveFilters && (
                                        <Badge size="small" intent="neutral">
                                            {conditions.length}
                                        </Badge>
                                    )}
                                </Row>
                            </Button>
                        </Popover>
                        {hasActiveFilters ? (
                            <Tooltip
                                content={translationString('TR_TX_FILTER_CLEAR_ALL')}
                                placement="top"
                            >
                                <IconButton
                                    icon="x"
                                    intent="neutral"
                                    priority="secondary"
                                    onClick={onClearConditions}
                                />
                            </Tooltip>
                        ) : null}
                    </ButtonGroup>
                )}
                {isTxFilteringEnabled && hasNetworkPotentialFraudTransactions(account.symbol) && (
                    <FilterAction />
                )}
                {isExportable && (
                    <ExportAction
                        account={account}
                        searchQuery={compiledSearchQuery}
                        conditions={conditions}
                    />
                )}
            </Row>
        );
    },
);
