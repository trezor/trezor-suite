/**
 * Copyright (c) 2025, Everstake.
 * Licensed under the BSD-3-Clause License. See LICENSE file for details.
 */

import { address, Address } from '@solana/web3.js';

export const CHAIN = 'solana';
export const MIN_AMOUNT = 10000000; // 0.01 SOL
export const MAINNET_VALIDATOR_ADDRESS = address(
  '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
);
export const DEVNET_VALIDATOR_ADDRESS = address(
  'GkqYQysEGmuL6V2AJoNnWZUz2ZBGWhzQXsJiXm2CLKAN',
);
export const FILTER_DATA_SIZE = 200n;
export const FILTER_OFFSET = 44n;

export enum Network {
  Mainnet = 'mainnet-beta',
  Devnet = 'devnet',
}

export const StakeState = {
  Inactive: 'inactive',
  Activating: 'activating',
  Active: 'active',
  Deactivating: 'deactivating',
  Deactivated: 'deactivated',
};

export const STAKE_ACCOUNT_V2_SIZE = 200;
export const ADDRESS_DEFAULT = address('11111111111111111111111111111111');
export const STAKE_HISTORY_ACCOUNT =
  'SysvarStakeHistory1111111111111111111111111' as Address<'SysvarStakeHistory1111111111111111111111111'>;
export const STAKE_CONFIG_ACCOUNT =
  'StakeConfig11111111111111111111111111111111' as Address<'StakeConfig11111111111111111111111111111111'>;
