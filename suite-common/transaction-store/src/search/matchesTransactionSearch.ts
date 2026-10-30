import { type Expression, type SqlBool, sql } from 'kysely';

import type {
    TransactionSearch,
    TransactionSearchOperator,
    TransactionSearchTerm,
} from './transactionSearch';
import {
    type TransactionsExpressionBuilder,
    someTransfer,
} from '../query/transactionStoreDatabase';

const DAY_SECONDS = 24 * 60 * 60;

// Redux's search compares amounts inclusively for `<` and `>`.
const AMOUNT_OPERATORS = {
    '<': '<=',
    '>': '>=',
    '=': '=',
    '!=': '!=',
} as const satisfies Record<TransactionSearchOperator, string>;

type JsonTreeRow = { type: string; path: string; value: string };

/** Case-insensitively contains the (lowercased) text; a missing value contains nothing. */
const contains = (
    eb: TransactionsExpressionBuilder,
    value: Expression<string | null>,
    text: string,
) =>
    eb(
        eb.fn<number>('instr', [eb.fn('lower', [eb.fn.coalesce(value, eb.val(''))]), eb.val(text)]),
        '>',
        0,
    );

/** Its UTXO inputs', outputs' and targets' addresses, which only the transaction's JSON has. */
const someAddress = (
    eb: TransactionsExpressionBuilder,
    condition: (value: Expression<string>) => Expression<SqlBool>,
) =>
    eb.exists(
        eb
            .selectFrom(sql<JsonTreeRow>`json_tree(${eb.ref('t.data')})`.as('a'))
            .select(ab => ab.lit(1).as('one'))
            .where('a.type', '=', 'text')
            .where('a.path', 'like', '%.addresses')
            .where(ab => condition(ab.ref('a.value'))),
    );

const matchesDate = (
    eb: TransactionsExpressionBuilder,
    operator: TransactionSearchOperator,
    date: string,
) => {
    const dayStart = Date.parse(`${date}T00:00:00Z`) / 1000;
    const dayEnd = dayStart + DAY_SECONDS;
    const byOperator: Record<TransactionSearchOperator, () => Expression<SqlBool>> = {
        '>': () => eb('t.block_time', '>', dayStart),
        '<': () => eb('t.block_time', '<', dayEnd),
        '=': () => eb.and([eb('t.block_time', '>', dayStart), eb('t.block_time', '<', dayEnd)]),
        '!=': () => eb.or([eb('t.block_time', '<', dayStart), eb('t.block_time', '>', dayEnd)]),
    };

    return eb.and([eb('t.block_time', 'is not', null), byOperator[operator]()]);
};

const matchesAmount = (
    eb: TransactionsExpressionBuilder,
    operator: TransactionSearchOperator,
    amount: string,
) =>
    someTransfer(eb, fb => {
        const value = fb.cast<number>('f.value', 'real');
        // A sent amount counts as negative.
        const signedValue = fb
            .case()
            .when('f.direction', '=', 'sent')
            .then(fb.neg(value))
            .else(value)
            .end();

        return fb.and([
            fb('f.value', 'is not', null),
            fb(signedValue, AMOUNT_OPERATORS[operator], Number(amount)),
        ]);
    });

const matchesText = (
    eb: TransactionsExpressionBuilder,
    {
        text,
        labelTxids,
        labelAddresses,
        isNativeSymbol,
    }: Extract<TransactionSearchTerm, { type: 'text' }>,
) => {
    const matches: Expression<SqlBool>[] = [
        contains(eb, eb.ref('t.txid'), text),
        someTransfer(eb, fb =>
            fb.or(
                (
                    ['f.from_address', 'f.to_address', 'f.contract', 'f.symbol', 'f.value'] as const
                ).map(column => contains(eb, fb.ref(column), text)),
            ),
        ),
        someAddress(eb, address => contains(eb, address, text)),
        contains(
            eb,
            eb.fn<string | null>('json_extract', [
                't.data',
                eb.val('$.ethereumSpecific.parsedData.name'),
            ]),
            text,
        ),
    ];

    if (isNativeSymbol) {
        matches.push(
            someTransfer(eb, fb =>
                fb.and([fb('f.contract', 'is', null), fb('f.direction', 'in', ['sent', 'recv'])]),
            ),
        );
    }
    if (labelTxids.length > 0) {
        matches.push(eb('t.txid', 'in', labelTxids));
    }
    if (labelAddresses.length > 0) {
        matches.push(
            someTransfer(eb, fb =>
                fb.or([
                    fb('f.from_address', 'in', labelAddresses),
                    fb('f.to_address', 'in', labelAddresses),
                ]),
            ),
            someAddress(eb, address => eb(address, 'in', labelAddresses)),
        );
    }

    return eb.or(matches);
};

const matchesTerm = (eb: TransactionsExpressionBuilder, term: TransactionSearchTerm) => {
    switch (term.type) {
        case 'date':
            return matchesDate(eb, term.operator, term.date);
        case 'amount':
            return matchesAmount(eb, term.operator, term.amount);
        case 'text':
            return matchesText(eb, term);
        case 'nothing':
            return eb.lit(false);
    }
};

/** The search as a condition on transactions aliased `t`: all terms of any one group match. */
export const matchesTransactionSearch = (
    eb: TransactionsExpressionBuilder,
    search: TransactionSearch,
) => eb.or(search.map(group => eb.and(group.map(term => matchesTerm(eb, term)))));
