import type { TransactionDetails, TransactionDetailsDefinition } from './TransactionDetails';

/**
 * Narrows every transaction to the backend's own type before the family sees it, so a family's
 * facts are computed from data that backend is known to provide.
 */
export const defineTransactionDetails = <TTransaction>(
    definition: TransactionDetailsDefinition<TTransaction>,
): TransactionDetails => ({
    getFacts: ({ transaction, isConfirmed }) => {
        const narrowed = definition.toTransaction(transaction);

        return narrowed === undefined
            ? []
            : definition.getFacts({ transaction: narrowed, isConfirmed });
    },
});
