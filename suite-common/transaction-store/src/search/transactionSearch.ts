export const TRANSACTION_SEARCH_OPERATORS = ['!=', '<', '>', '='] as const;

export type TransactionSearchOperator = (typeof TRANSACTION_SEARCH_OPERATORS)[number];

/** What the app knows about a free-text term that the store does not: labels and symbols. */
export type TransactionSearchTextMatches = {
    /** Transactions whose output labels contain the text. */
    labelTxids: string[];
    /** Addresses whose labels contain the text. */
    labelAddresses: string[];
    /** The text is the network's own symbol, so it matches the coin's movements. */
    isNativeSymbol: boolean;
};

export type TransactionSearchTerm =
    /** A day, `YYYY-MM-DD`, compared with the block time. */
    | { type: 'date'; operator: TransactionSearchOperator; date: string }
    /** An amount in units; a sent one counts as negative. */
    | { type: 'amount'; operator: TransactionSearchOperator; amount: string }
    /** Lowercased free text: txid, addresses, token, amount digits, function name, labels. */
    | ({ type: 'text'; text: string } & TransactionSearchTextMatches)
    /** A term that can match nothing, e.g. an operator before something not a date or amount. */
    | { type: 'nothing' };

/**
 * A query as data, built by `parseTransactionSearch` and run as SQL in the store's worker:
 * a transaction matches when all terms of any one group do. `a & b | c` is `[[a, b], [c]]`.
 */
export type TransactionSearch = TransactionSearchTerm[][];
