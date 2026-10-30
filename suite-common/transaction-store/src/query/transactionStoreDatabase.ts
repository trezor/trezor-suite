import {
    type Compilable,
    DummyDriver,
    type Expression,
    type ExpressionBuilder,
    type Generated,
    Kysely,
    type SqlBool,
    SqliteAdapter,
    SqliteIntrospector,
    SqliteQueryCompiler,
} from 'kysely';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import type { TransferKind } from '../repository/flattenTransfers';
import type { SqlQuery, SqlValue } from '../sqlite/transactionStoreSqlite';
import type { TransactionSourceErrorType } from '../transactionStoreTypes';

/** The tables as the migrations leave them; keep the two in step. */
export type TransactionStoreDatabase = {
    accounts: {
        account_key: string;
        symbol: NetworkSymbol;
        descriptor: string;
    };
    transactions: {
        account_key: string;
        txid: string;
        /** `NULL` while the transaction waits in the mempool. */
        block_height: number | null;
        block_time: number | null;
        type: string;
        /** The blockchain-link `Transaction` as JSON. */
        data: string;
    };
    sync_state: {
        account_key: string;
        /** 1 once the whole history is stored, not just its newest part. */
        is_complete: Generated<number>;
        last_synced_at: number | null;
        last_error: TransactionSourceErrorType | null;
        /** 1 while a sync of the account runs. */
        is_syncing: Generated<number>;
    };
    /** Every asset movement flat; see `flattenTransfers`. */
    transfers: {
        account_key: string;
        txid: string;
        idx: number;
        kind: TransferKind;
        contract: string | null;
        direction: string;
        /** In base units. */
        amount: string;
        /** In units, as people search for it. */
        value: string | null;
        decimals: number | null;
        symbol: string | null;
        standard: string | null;
        from_address: string | null;
        to_address: string | null;
        block_height: number | null;
        block_time: number | null;
    };
    /** The contracts of a network's token definitions, with the user's show/hide applied. */
    known_tokens: {
        symbol: NetworkSymbol;
        kind: 'coin' | 'nft';
        contract: string;
    };
    /** Networks whose definitions the app has fed; before, no token is "fake". */
    token_definition_networks: {
        symbol: NetworkSymbol;
    };
};

/** A query over transactions aliased `t`, which the filters below are conditions on. */
type TransactionsScope = TransactionStoreDatabase & { t: TransactionStoreDatabase['transactions'] };

export type TransactionsExpressionBuilder = ExpressionBuilder<TransactionsScope, 't'>;

export type TransfersExpressionBuilder = ExpressionBuilder<
    TransactionsScope & { f: TransactionStoreDatabase['transfers'] },
    't' | 'f'
>;

/** Whether any of the transaction's transfers, aliased `f`, meets the condition. */
export const someTransfer = (
    eb: TransactionsExpressionBuilder,
    condition: (fb: TransfersExpressionBuilder) => Expression<SqlBool>,
) =>
    eb.exists(
        eb
            .selectFrom('transfers as f')
            .select(fb => fb.lit(1).as('one'))
            .whereRef('f.account_key', '=', 't.account_key')
            .whereRef('f.txid', '=', 't.txid')
            .where(condition),
    );

/**
 * Builds and compiles queries; it never runs one. The app and the engine both use it, and the
 * compiled SQL runs in the store, wherever that is.
 */
export const transactionStoreDb = new Kysely<TransactionStoreDatabase>({
    dialect: {
        createAdapter: () => new SqliteAdapter(),
        createDriver: () => new DummyDriver(),
        createIntrospector: db => new SqliteIntrospector(db),
        createQueryCompiler: () => new SqliteQueryCompiler(),
    },
});

/** A compiled query, plain data to send to the store, typed by the rows it returns. */
export type TransactionStoreQuery<TRow> = SqlQuery & {
    /** Never set; carries the row type from where the query is built to where its rows land. */
    readonly rowType?: TRow;
};

/** The rows a compiled query returns, one of them. */
export type TransactionStoreRow<TQuery> =
    TQuery extends TransactionStoreQuery<infer TRow> ? TRow : never;

export const toTransactionStoreQuery = <TRow>(
    query: Compilable<TRow>,
): TransactionStoreQuery<TRow> => {
    const { sql, parameters } = query.compile();

    // The builders bind only strings, numbers and `null`.
    return { sql, parameters: parameters as ReadonlyArray<SqlValue> };
};
