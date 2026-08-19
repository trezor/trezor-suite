import {
    type PrecomposedTransaction,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

/**
 * Priced fee level the account cannot pay for. The fee selector turns any errored level into the
 * "not enough <coin> to cover the transaction fee" banner and blocks the submit, which is where
 * every yield flow has to end up — a transaction that outspends the balance would otherwise be
 * signed on the device and only then rejected by the node.
 */
export const buildInsufficientFeeBalanceTransaction = (): PrecomposedTransaction => ({
    type: 'error',
    error: 'AMOUNT_IS_NOT_ENOUGH',
    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
});

/**
 * Native coin the transaction spends. `totalSpent` counts the transferred amount in the spent
 * token's units, so it only doubles as the native spend when the transaction moves the native coin
 * itself (a wrap); for token flows (deposit, withdraw, unwrap) the fee is the whole native cost.
 */
const getNativeSpend = (precomposedTransaction: PrecomposedTransactionFinal): string =>
    precomposedTransaction.token ? precomposedTransaction.fee : precomposedTransaction.totalSpent;

/** Keeps a priced fee level only while the native balance covers everything it spends. */
export const applyYieldFeeAffordability = (
    precomposedTransaction: PrecomposedTransactionFinal,
    availableBalance: string,
): PrecomposedTransaction =>
    new BigNumber(getNativeSpend(precomposedTransaction)).gt(availableBalance)
        ? buildInsufficientFeeBalanceTransaction()
        : precomposedTransaction;
