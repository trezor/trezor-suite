import BigNumber from 'bignumber.js';

import type { WalletAccountTransaction } from '@suite-common/wallet-types';

export const getIsZeroValuePhishing = (transaction: WalletAccountTransaction) =>
    new BigNumber(transaction.amount).isEqualTo(0) &&
    !!transaction.tokens.length &&
    transaction.tokens.every(token => new BigNumber(token.amount).isEqualTo(0));
