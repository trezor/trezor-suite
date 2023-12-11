import BigNumber from 'bignumber.js';

export const MIN_ETH_AMOUNT_FOR_STAKING = new BigNumber(0.1);
export const MIN_ETH_FOR_WITHDRAWALS = new BigNumber(0.03);
export const MIN_ETH_BALANCE_FOR_STAKING = MIN_ETH_AMOUNT_FOR_STAKING.plus(MIN_ETH_FOR_WITHDRAWALS);

// TODO: For testing and demo purposes only. Remove when real data is added
export const STAKED_ETH = new BigNumber(0.1);
export const REWARDS_ETH = STAKED_ETH.div(8);
export const STAKED_ETH_WITH_REWARDS = STAKED_ETH.plus(REWARDS_ETH);
