import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export const getSolanaPrecomposedNetAmount = (
    precomposedTransaction: Pick<PrecomposedTransactionFinal, 'totalSpent' | 'fee'>,
) => new BigNumber(precomposedTransaction.totalSpent).minus(precomposedTransaction.fee).toFixed(0);
