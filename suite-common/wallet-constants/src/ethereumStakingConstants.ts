import { BigNumber } from '@trezor/utils/src/bigNumber';

// Used when Everstake pool stats are not available from the API.
export const BACKUP_ETH_APY = 4.13;

// Slack discussion https://satoshilabs.slack.com/archives/C0543DJBK0C/p1719409880504649?thread_ts=1719403259.875369&cid=C0543DJBK0C
// increasing gas limit as tx can consume more than it was estimated due to edge cases
// stake/unstake method usually consumes 97k-425k but can take up to 1M
// claim method 97k-300k
export const STAKE_GAS_LIMIT_RESERVE = 220_000;

export const MIN_ETH_AMOUNT_FOR_STAKING = new BigNumber(0.1);
export const MAX_ETH_AMOUNT_FOR_STAKING = new BigNumber(1_000_000);
export const MIN_ETH_FOR_WITHDRAWALS = new BigNumber(0.03);
export const MIN_ETH_BALANCE_FOR_STAKING = MIN_ETH_AMOUNT_FOR_STAKING.plus(MIN_ETH_FOR_WITHDRAWALS);

export const BACKUP_REWARD_PAYOUT_DAYS = 7;
