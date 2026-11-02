import type { StakingAccount } from '@suite-common/earn-staking-common';
import type { Account } from '@suite-common/wallet-types';

declare const account: Account;

const stakingAccount: StakingAccount = account;

// @ts-expect-error The contract is a subset of the app account, so the other direction must not hold.
const back: Account = stakingAccount;

void stakingAccount;
void back;
