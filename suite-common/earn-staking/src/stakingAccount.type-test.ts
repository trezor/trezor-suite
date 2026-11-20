import type { StakingAccount, StakingTransaction } from '@suite-common/earn-staking-common';
import type { Account, WalletAccountTransaction } from '@suite-common/wallet-types';

declare const account: Account;
declare const transaction: WalletAccountTransaction;

const stakingAccount: StakingAccount = account;

// @ts-expect-error The contract is a subset of the app account, so the other direction must not hold.
const back: Account = stakingAccount;

const stakingTransaction: StakingTransaction = transaction;

void stakingAccount;
void back;
void stakingTransaction;
