import type { Account } from '@suite-common/wallet-types';
import type { OpenAccount } from '@trezor/network-module-suite-common-types';

declare const account: Account;

// Network families read the app's account through `OpenAccount`, so the network layer never
// imports wallet types; any wallet account must fit it as is.
const _openAccount: OpenAccount = account;

void _openAccount;
