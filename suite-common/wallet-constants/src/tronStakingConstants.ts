import { BigNumber } from '@trezor/utils';

export const MIN_TRON_AMOUNT_FOR_STAKING = new BigNumber(1);
export const MAX_TRON_AMOUNT_FOR_STAKING = new BigNumber(1_000_000_000);
export const MIN_TRON_FOR_WITHDRAWALS = new BigNumber(0.01);
export const MIN_TRON_BALANCE_FOR_FEE_BUFFER = new BigNumber(5);
export const MIN_TRON_BALANCE_FOR_STAKING =
    MIN_TRON_AMOUNT_FOR_STAKING.plus(MIN_TRON_FOR_WITHDRAWALS);

// Super Representative addresses offered for voting in Suite
// source: https://earn.trezor.io/staking/v1/trx/stats
export const LUGANODES_TRON_SRS = ['TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9'];
export const P2P_ORG_TRON_SRS = ['TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij'];
