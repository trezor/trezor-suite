import type {
    TransactionSearch,
    TransactionSearchOperator,
    TransactionSearchTerm,
} from './transactionSearch';
import type { SqlValue } from '../sqlite/transactionStoreSqlite';

type Clause = { sql: string; parameters: SqlValue[] };

const DAY_SECONDS = 24 * 60 * 60;

// Redux's search compares amounts inclusively for `<` and `>`.
const AMOUNT_OPERATORS: Record<TransactionSearchOperator, string> = {
    '<': '<=',
    '>': '>=',
    '=': '=',
    '!=': '!=',
};

const toPlaceholders = (values: ReadonlyArray<unknown>) => values.map(() => '?').join(', ');

/** The transaction's transfers, for the alias `t` the transactions query uses. */
const transfersOf = (condition: string) =>
    `EXISTS (SELECT 1 FROM transfers f
        WHERE f.account_key = t.account_key AND f.txid = t.txid AND (${condition}))`;

/** Its UTXO inputs', outputs' and targets' addresses, which only the transaction's JSON has. */
const addressesOf = (condition: string) =>
    `EXISTS (SELECT 1 FROM json_tree(t.data) a
        WHERE a.type = 'text' AND a.path LIKE '%.addresses' AND (${condition}))`;

const toDateClause = (operator: TransactionSearchOperator, date: string): Clause => {
    const dayStart = Date.parse(`${date}T00:00:00Z`) / 1000;
    const dayEnd = dayStart + DAY_SECONDS;
    const byOperator: Record<TransactionSearchOperator, Clause> = {
        '>': { sql: 't.block_time > ?', parameters: [dayStart] },
        '<': { sql: 't.block_time < ?', parameters: [dayEnd] },
        '=': { sql: 't.block_time > ? AND t.block_time < ?', parameters: [dayStart, dayEnd] },
        '!=': { sql: '(t.block_time < ? OR t.block_time > ?)', parameters: [dayStart, dayEnd] },
    };
    const clause = byOperator[operator];

    return { sql: `(t.block_time IS NOT NULL AND ${clause.sql})`, parameters: clause.parameters };
};

const toAmountClause = (operator: TransactionSearchOperator, amount: string): Clause => ({
    sql: transfersOf(
        `f.value IS NOT NULL AND
        (CASE WHEN f.direction = 'sent' THEN -CAST(f.value AS REAL) ELSE CAST(f.value AS REAL) END)
        ${AMOUNT_OPERATORS[operator]} ?`,
    ),
    parameters: [Number(amount)],
});

const toTextClause = (term: Extract<TransactionSearchTerm, { type: 'text' }>): Clause => {
    const { text, labelTxids, labelAddresses, isNativeSymbol } = term;
    const parts: Clause[] = [
        { sql: 'instr(lower(t.txid), ?) > 0', parameters: [text] },
        {
            sql: transfersOf(
                `instr(lower(coalesce(f.from_address, '')), ?) > 0
                OR instr(lower(coalesce(f.to_address, '')), ?) > 0
                OR instr(lower(coalesce(f.contract, '')), ?) > 0
                OR instr(lower(coalesce(f.symbol, '')), ?) > 0
                OR instr(coalesce(f.value, ''), ?) > 0`,
            ),
            parameters: [text, text, text, text, text],
        },
        { sql: addressesOf('instr(lower(a.value), ?) > 0'), parameters: [text] },
        {
            sql: `instr(lower(coalesce(
                json_extract(t.data, '$.ethereumSpecific.parsedData.name'), '')), ?) > 0`,
            parameters: [text],
        },
    ];

    if (isNativeSymbol) {
        parts.push({
            sql: transfersOf("f.contract IS NULL AND f.direction IN ('sent', 'recv')"),
            parameters: [],
        });
    }
    if (labelTxids.length > 0) {
        parts.push({ sql: `t.txid IN (${toPlaceholders(labelTxids)})`, parameters: labelTxids });
    }
    if (labelAddresses.length > 0) {
        const placeholders = toPlaceholders(labelAddresses);
        parts.push({
            sql: `${transfersOf(
                `f.from_address IN (${placeholders}) OR f.to_address IN (${placeholders})`,
            )} OR ${addressesOf(`a.value IN (${placeholders})`)}`,
            parameters: [...labelAddresses, ...labelAddresses, ...labelAddresses],
        });
    }

    return {
        sql: `(${parts.map(part => part.sql).join(' OR ')})`,
        parameters: parts.flatMap(part => part.parameters),
    };
};

const toTermClause = (term: TransactionSearchTerm): Clause => {
    switch (term.type) {
        case 'date':
            return toDateClause(term.operator, term.date);
        case 'amount':
            return toAmountClause(term.operator, term.amount);
        case 'text':
            return toTextClause(term);
        case 'nothing':
            return { sql: '0', parameters: [] };
    }
};

const joinClauses = (clauses: Clause[], operator: 'AND' | 'OR'): Clause => ({
    sql: `(${clauses.map(clause => clause.sql).join(` ${operator} `)})`,
    parameters: clauses.flatMap(clause => clause.parameters),
});

/** The search as a condition on transactions aliased `t`, evaluated in SQLite. */
export const toTransactionSearchClause = (search: TransactionSearch): Clause =>
    joinClauses(
        search.map(group => joinClauses(group.map(toTermClause), 'AND')),
        'OR',
    );
