import BigNumber from 'bignumber.js';

export const MIN_ETH_AMOUNT_FOR_STAKING = new BigNumber(0.1);
export const MIN_ETH_FOR_WITHDRAWALS = new BigNumber(0.03);
export const MIN_ETH_BALANCE_FOR_STAKING = MIN_ETH_AMOUNT_FOR_STAKING.plus(MIN_ETH_FOR_WITHDRAWALS);
// source is a required parameter for some functions in the Everstake Wallet SDK.
// This parameter is used for some contract calls.
// It is a constant which allows the SDK to define which app calls its functions.
// Each app which integrates the SDK has its own source, e.g. source for Trezor Suite is '1'.
export const WALLET_SDK_SOURCE = '1';

// TODO: For testing and demo purposes only. Remove when real data is added
export const STAKED_ETH = new BigNumber(0.1);
export const REWARDS_ETH = STAKED_ETH.div(8);
export const STAKED_ETH_WITH_REWARDS = STAKED_ETH.plus(REWARDS_ETH);
export const UNSTAKED_ETH = new BigNumber(0.23005712);

// TODO: Get from staking SDK
export const CONTRACT_POOL_ADDRESS = '0xD523794C879D9eC028960a231F866758e405bE34';
export const CONTRACT_ACCOUNTING_ADDRESS = '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e';
