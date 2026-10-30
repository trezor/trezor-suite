import type { AccountInfo } from '@trezor/connect-common';
import type { AccountType } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type StakingAccount = Pick<
    AccountInfo,
    'descriptor' | 'balance' | 'availableBalance' | 'addresses' | 'utxo' | 'misc'
> & {
    symbol: NetworkSymbol;
    path: string;
    accountType: AccountType;
};
