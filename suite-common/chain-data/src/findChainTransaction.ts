import type { Transaction } from '@trezor/blockchain-link-types';
import type { ChainTransactionsPage } from '@trezor/network-module-suite-common-types';

/** A loaded transaction of the account, by txid. */
export const findChainTransaction = (
    pages: readonly ChainTransactionsPage[],
    txid: string,
): Transaction | undefined =>
    pages.flatMap(page => page.transactions).find(transaction => transaction.txid === txid);
