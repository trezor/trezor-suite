import { Account } from '@suite-common/wallet-types';

export type GroupedAccounts = Record<string, [Account, ...Account[]]>;
