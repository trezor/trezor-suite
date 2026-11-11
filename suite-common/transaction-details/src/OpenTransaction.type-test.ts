import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import type { OpenTransaction } from '@trezor/network-module-suite-common-types';

declare const transaction: WalletAccountTransaction;

// Network families read the app's transactions through `OpenTransaction`, the shape every backend
// normalizes to, so the network layer never imports wallet types; any wallet transaction must fit.
const _openTransaction: OpenTransaction = transaction;

void _openTransaction;
