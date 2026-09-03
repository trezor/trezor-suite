import { BigNumber } from '@trezor/utils';

export const MIN_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(0);
export const MAX_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(72_000_000);
export const MIN_CARDANO_FOR_WITHDRAWALS = new BigNumber(0);

export const MIN_CARDANO_BALANCE_FOR_FEE_BUFFER = new BigNumber(0);
export const MIN_CARDANO_BALANCE_FOR_STAKING = MIN_CARDANO_AMOUNT_FOR_STAKING.plus(
    MIN_CARDANO_FOR_WITHDRAWALS,
);
