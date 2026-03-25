import { useCallback, useState } from 'react';

import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

export type AmountOperator = '>' | '<' | '=' | '!=';
export type TxTypeFilter = 'recv' | 'sent' | 'self';
export type TxStatusFilter = 'confirmed' | 'pending';

export type NewFilterCondition =
    | { type: 'date'; from?: string; to?: string }
    | { type: 'amount'; operator: AmountOperator; value: string }
    | { type: 'address'; value: string }
    | { type: 'txId'; value: string }
    | { type: 'txType'; value: TxTypeFilter }
    | { type: 'status'; value: TxStatusFilter };

export type FilterCondition = NewFilterCondition & { id: string };

export type ConditionLogic = 'AND' | 'OR';

type FiltersState = {
    conditions: FilterCondition[];
    logics: ConditionLogic[];
};

const TEXT_CONDITION_TYPES = ['date', 'amount', 'address', 'txId'] as const;

const isTextCondition = (c: FilterCondition | NewFilterCondition) =>
    (TEXT_CONDITION_TYPES as readonly string[]).includes(c.type);

const compileCondition = (condition: FilterCondition): string => {
    switch (condition.type) {
        case 'date': {
            const parts: string[] = [];
            if (condition.from) parts.push(`> ${condition.from}`);
            if (condition.to) parts.push(`< ${condition.to}`);

            return parts.join(' & ');
        }
        case 'amount':
            return `${condition.operator} ${condition.value}`;
        case 'address':
        case 'txId':
            return condition.value;
        default:
            return '';
    }
};

/**
 * Compiles text-based conditions (date, amount, address, txId) to search string.
 * Non-text conditions (txType, status) are handled by applyNonTextFilters separately.
 */
export const compileFilters = (
    conditions: FilterCondition[],
    logics: ConditionLogic[],
    fulltext: string,
): string => {
    const textConditions: FilterCondition[] = [];
    const textLogics: ConditionLogic[] = [];

    // Extract text conditions while preserving pairwise logics between adjacent text conditions
    let lastTextIndex = -1;
    conditions.forEach((condition, i) => {
        if (isTextCondition(condition)) {
            if (lastTextIndex !== -1) {
                // Use AND if non-text conditions exist between the two text conditions
                textLogics.push(lastTextIndex + 1 === i ? (logics[lastTextIndex] ?? 'AND') : 'AND');
            }
            textConditions.push(condition);
            lastTextIndex = i;
        }
    });

    const filterParts = textConditions.map(compileCondition).filter(Boolean);

    if (filterParts.length === 0) return fulltext;

    let filterString = filterParts[0];
    for (let i = 1; i < filterParts.length; i++) {
        const logic = textLogics[i - 1] ?? 'AND';
        filterString += logic === 'AND' ? ` & ${filterParts[i]}` : ` | ${filterParts[i]}`;
    }

    if (!fulltext.trim()) return filterString;

    return `${fulltext.trim()} & ${filterString}`;
};

/**
 * Applies non-text conditions (txType, status) as pre-filters with AND logic.
 */
export const applyNonTextFilters = (
    transactions: WalletAccountTransaction[],
    conditions: FilterCondition[],
): WalletAccountTransaction[] => {
    const nonTextConditions = conditions.filter(c => !isTextCondition(c));
    if (nonTextConditions.length === 0) return transactions;

    return transactions.filter(tx =>
        nonTextConditions.every(condition => {
            if (condition.type === 'txType') return tx.type === condition.value;
            if (condition.type === 'status') {
                return condition.value === 'pending' ? isPending(tx) : !isPending(tx);
            }

            return true;
        }),
    );
};

let idCounter = 0;
const generateId = () => String(++idCounter);

export const useTransactionFilters = () => {
    const [{ conditions, logics }, setFiltersState] = useState<FiltersState>({
        conditions: [],
        logics: [],
    });
    const [fulltext, setFulltext] = useState('');

    const addCondition = useCallback((condition: NewFilterCondition) => {
        setFiltersState(prev => ({
            conditions: [...prev.conditions, { ...condition, id: generateId() } as FilterCondition],
            logics: prev.conditions.length > 0 ? [...prev.logics, 'AND' as ConditionLogic] : [],
        }));
    }, []);

    const updateCondition = useCallback((id: string, condition: NewFilterCondition) => {
        setFiltersState(prev => ({
            ...prev,
            conditions: prev.conditions.map(c =>
                c.id === id ? ({ ...condition, id } as FilterCondition) : c,
            ),
        }));
    }, []);

    const removeCondition = useCallback((id: string) => {
        setFiltersState(prev => {
            const index = prev.conditions.findIndex(c => c.id === id);
            if (index === -1) return prev;

            const nextConditions = prev.conditions.filter(c => c.id !== id);
            const nextLogics = [...prev.logics];
            const logicIndex = index === 0 ? 0 : index - 1;
            if (nextLogics.length > 0) nextLogics.splice(logicIndex, 1);

            return { conditions: nextConditions, logics: nextLogics };
        });
    }, []);

    const toggleLogic = useCallback((index: number) => {
        setFiltersState(prev => {
            const nextLogics = [...prev.logics];
            nextLogics[index] = nextLogics[index] === 'AND' ? 'OR' : 'AND';

            return { ...prev, logics: nextLogics };
        });
    }, []);

    const clearConditions = useCallback(() => {
        setFiltersState({ conditions: [], logics: [] });
    }, []);

    const searchQuery = compileFilters(conditions, logics, fulltext);

    return {
        conditions,
        logics,
        fulltext,
        setFulltext,
        addCondition,
        updateCondition,
        removeCondition,
        toggleLogic,
        clearConditions,
        searchQuery,
        hasActiveFilters: conditions.length > 0,
    };
};
