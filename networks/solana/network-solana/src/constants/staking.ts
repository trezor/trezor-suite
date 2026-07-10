import { BigNumber } from '@trezor/utils';

export const MIN_SOL_AMOUNT_FOR_STAKING = new BigNumber(1);
export const MAX_SOL_AMOUNT_FOR_STAKING = new BigNumber(10_000_000);
export const MIN_SOL_FOR_WITHDRAWALS = new BigNumber(0.02);
export const MIN_SOL_BALANCE_FOR_FEE_BUFFER = new BigNumber(0.005);
export const MIN_SOL_BALANCE_FOR_STAKING = MIN_SOL_AMOUNT_FOR_STAKING.plus(MIN_SOL_FOR_WITHDRAWALS);
export const SOL_STAKING_OPERATION_FEE = new BigNumber(70_000); // 0.00007 SOL
export const SOL_COMPUTE_UNIT_PRICE = 100000;
export const SOL_COMPUTE_UNIT_LIMIT = 200000;

export const SOL_BASE_FEE = 5000n;
export const SOL_MICROLAMPORTS_PER_LAMPORT = 1_000_000n;

export const SOLANA_EPOCH_DAYS = 2;

export const STAKE_ACCOUNT_V2_SIZE = 200;

export const EVERSTAKE_SOLANA_MAINNET_VALIDATOR = '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF';
export const EVERSTAKE_SOLANA_DEVNET_VALIDATOR = 'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN';
export const EVERSTAKE_VOTER_PUBKEYS = [
    EVERSTAKE_SOLANA_MAINNET_VALIDATOR, // mainnet
    EVERSTAKE_SOLANA_DEVNET_VALIDATOR, // devnet
];

export const StakeState = {
    Inactive: 'inactive',
    Activating: 'activating',
    Active: 'active',
    Deactivating: 'deactivating',
    Deactivated: 'deactivated',
};
