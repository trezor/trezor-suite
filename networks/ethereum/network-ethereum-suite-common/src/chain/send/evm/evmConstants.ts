// sending ETH to contract needs more gas limit than 21000
export const ETH_TRANSFER_BACKUP_GAS_LIMIT = '50000';
export const ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT = '250000';

// 4 bytes function signature of solidity erc20 `transfer(address,uint256)`
export const ERC20_TRANSFER = 'a9059cbb';

/** Gas a staking contract call may need beyond the estimate, as staking pools change state. */
export const STAKE_GAS_LIMIT_RESERVE = 220_000;
