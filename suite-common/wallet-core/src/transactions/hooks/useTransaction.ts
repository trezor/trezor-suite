import { useEntityById } from '@suite-common/redux-utils';
import type { AccountKey } from '@suite-common/wallet-types';

import { getTransactionId, transactionsIndex } from '../transactionsIndex';

/**
 * One transaction, by the account it is filed under and its txid.
 *
 * Re-renders when that transaction changes and at no other time — a row in a transaction list is
 * not woken by the rest of the list, nor by any other reducer writing.
 */
export const useTransaction = (accountKey: AccountKey, txid: string) =>
    useEntityById(transactionsIndex, getTransactionId(accountKey, txid));
