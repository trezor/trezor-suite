import { EthereumTransactionFacts } from './EthereumTransactionFacts';
import { type TransactionFactsOverrides } from './transactionFactsTypes';

/** The families whose transaction facts the desktop app presents its own way. */
export const transactionFactsOverrides: TransactionFactsOverrides = {
    ethereum: EthereumTransactionFacts,
};
