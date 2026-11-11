import type {
    OpenNetwork,
    OpenTransaction,
    TransactionFact,
} from '@trezor/network-module-suite-common-types';

/** What a transaction detail UI renders, with no opinion on how it looks. */
export type TransactionFacts = {
    /** The family serving the account's network, so an app can pick an override for it. */
    readonly family: string;
    readonly facts: readonly TransactionFact[];
};

type GetTransactionFactsParams = {
    readonly network: OpenNetwork | undefined;
    readonly transaction: OpenTransaction;
    readonly isConfirmed: boolean;
};

/** `undefined` when the network has no transaction details for its current backend. */
export const getTransactionFacts = ({
    network,
    transaction,
    isConfirmed,
}: GetTransactionFactsParams): TransactionFacts | undefined => {
    const transactionDetails = network?.capabilities.transactionDetails;

    return network && transactionDetails
        ? {
              family: network.family,
              facts: transactionDetails.getFacts({ transaction, isConfirmed }),
          }
        : undefined;
};
