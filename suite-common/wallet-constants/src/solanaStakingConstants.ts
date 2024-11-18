import { BigNumber } from '@trezor/utils';

// TODO: change to solana constants
export const MIN_SOL_AMOUNT_FOR_STAKING = new BigNumber(0.1);
export const MAX_SOL_AMOUNT_FOR_STAKING = new BigNumber(1_000_000);
export const MIN_SOL_FOR_WITHDRAWALS = new BigNumber(0.03);
export const MIN_SOL_BALANCE_FOR_STAKING = MIN_SOL_AMOUNT_FOR_STAKING.plus(MIN_SOL_FOR_WITHDRAWALS);

export const SOLANA_DEV_NET_URL = 'https://solana-dev.trezor.io/';
export const SOLANA_MAIN_NET_URL = 'https://solana1.trezor.io/';
