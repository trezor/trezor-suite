import {
    TRANSACTION_SEARCH_OPERATORS,
    type TransactionSearch,
    type TransactionSearchTerm,
    type TransactionSearchTextMatches,
} from './transactionSearch';

const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

const isNumeric = (value: string) => value !== '' && !isNaN(Number(value));

/** `null` for a term that constrains nothing (empty, or only an operator). */
const parseTerm = (
    rawTerm: string,
    resolveText: (text: string) => TransactionSearchTextMatches,
): TransactionSearchTerm | null => {
    const term = rawTerm.trim();
    const operator = TRANSACTION_SEARCH_OPERATORS.find(candidate => term.startsWith(candidate));

    if (term === '' || term === operator) return null;
    if (DATE_REGEX.test(term)) return { type: 'date', operator: '=', date: term };

    if (operator !== undefined) {
        const operand = term.slice(operator.length).trim();

        if (DATE_REGEX.test(operand)) return { type: 'date', operator, date: operand };
        if (isNumeric(operand)) return { type: 'amount', operator, amount: operand };

        return { type: 'nothing' };
    }

    const text = term.toLowerCase();

    return { type: 'text', text, ...resolveText(text) };
};

/**
 * The transaction list's search syntax, as Redux's list has it: free text, `YYYY-MM-DD`,
 * amounts and dates after `<`, `>`, `=` or `!=`, joined by `&` (and) and `|` (or). The app
 * resolves what only it knows (labels, the native symbol) through `resolveText`. `null` when the
 * query constrains nothing, so the plain list is shown.
 */
export const parseTransactionSearch = (
    query: string,
    resolveText: (text: string) => TransactionSearchTextMatches,
): TransactionSearch | null => {
    const groups = query
        .split('|')
        .map(group =>
            group
                .split('&')
                .map(term => parseTerm(term, resolveText))
                .filter((term): term is TransactionSearchTerm => term !== null),
        )
        // Empty groups (`a |`) are left out, as Redux's search leaves them out.
        .filter(group => group.length > 0);

    return groups.length === 0 ? null : groups;
};
