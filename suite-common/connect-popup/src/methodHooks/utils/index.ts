import { type Network } from '@suite-common/wallet-config';
import { accountsActions } from '@suite-common/wallet-core';
import type { Bip43Path } from '@trezor/crypto-utils';

export const createPlaceholderAccount = (
    network: Pick<Network, 'networkType' | 'symbol' | 'name'>,
    path: Bip43Path,
) =>
    accountsActions.createAccount({
        // Real device state not needed, this is also better to differentiate from real accounts
        deviceState: 'placeholder@connect:0',
        index: 0,
        path,
        accountType: 'placeholder',
        symbol: network.symbol,
        accountInfo: {
            path,
            descriptor: '',
            balance: '',
            availableBalance: '',
            empty: false,
            history: { total: 0, unconfirmed: 0 },
        },
        imported: true,
        visible: false,
        accountLabel: network.name,
    });
