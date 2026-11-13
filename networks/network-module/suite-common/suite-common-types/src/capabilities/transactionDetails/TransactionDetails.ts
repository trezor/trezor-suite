import type { Transaction } from '@trezor/blockchain-link-types';

import type { Label } from '../Label';

/**
 * A transaction as every backend hands it over: Blockbook, Electrum, a direct RPC node or any other
 * worker normalizes to this shape, each filling only the network-specific parts it knows.
 */
export type OpenTransaction = Transaction;

/** The value of one fact, in a form any platform renders without knowing the network. */
export type TransactionFactValue =
    | {
          readonly kind: 'text';
          readonly text: string;
          /** Free text written by someone else, such as a memo, which may carry links. */
          readonly isUserProvided?: boolean;
      }
    | { readonly kind: 'count'; readonly value: number }
    /**
     * `rate` is already rounded the way the network presents it, and `unit` is the symbol the
     * network writes after it, such as `sat/vB` or `Gwei`. The family states both, so a network
     * with another unit changes nothing here.
     */
    | { readonly kind: 'feeRate'; readonly rate: string; readonly unit: string }
    | { readonly kind: 'usage'; readonly limit: number; readonly used?: number }
    /** Known only once the transaction is in a block, such as the base fee it paid. */
    | { readonly kind: 'pendingUntilConfirmed' };

export type TransactionFactIcon = 'fee' | 'gas' | 'tag' | 'note' | 'sequence';

export type TransactionFact = {
    /** Stable per fact, so an app can decorate one, such as the nonce of a stuck transaction. */
    readonly id: string;
    readonly label: Label;
    readonly icon: TransactionFactIcon;
    readonly value: TransactionFactValue;
};

export type TransactionFactsParams = {
    readonly transaction: OpenTransaction;
    readonly isConfirmed: boolean;
};

/**
 * The network-specific facts about a transaction, as every UI sees them: fee rate, gas, nonce,
 * memos and the like. What is in the list depends on the network and on the backend that served
 * the transaction.
 *
 * @serviceContract
 */
export type TransactionDetails = {
    getFacts(params: TransactionFactsParams): readonly TransactionFact[];
};

export type ClosedTransactionFactsParams<TTransaction> = {
    readonly transaction: TTransaction;
    readonly isConfirmed: boolean;
};

/**
 * What a family implements for one backend, written against the data that backend actually
 * provides. `defineTransactionDetails` turns it into the open `TransactionDetails`.
 */
export type TransactionDetailsDefinition<TTransaction> = {
    /** Reads what this backend provides; `undefined` means there is nothing to show. */
    toTransaction(transaction: OpenTransaction): TTransaction | undefined;
    getFacts(params: ClosedTransactionFactsParams<TTransaction>): readonly TransactionFact[];
};
