import { type StakingProductId } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type StakingProductAdapterBase } from '../../products/types';

export type TronStakingOperation = 'freeze' | 'unfreeze' | 'vote' | 'withdraw' | 'claim';

export type TronStakingTxClassification = {
    operation: TronStakingOperation;
    /** Products whose Super Representatives the transaction votes for; empty for account-wide operations. */
    productIds: StakingProductId[];
};

export type TronStakingProductAdapter = StakingProductAdapterBase<'tron'> & {
    readonly unstakingPeriodDays: number;
    classifyTransaction: (tx: WalletAccountTransaction) => TronStakingTxClassification | null;
};
