import { Bip43Path, Network } from '@suite-common/wallet-config';
import { accountsActions } from '@suite-common/wallet-core';

export const createPlaceholderAccount = (
    network: Pick<Network, 'networkType' | 'symbol' | 'name'>,
    path: Bip43Path,
) =>
    accountsActions.createAccount({
        // Real device state not needed, this is also better to differentiate from real accounts
        deviceState: 'placeholder@connect:0',
        discoveryItem: {
            index: 0,
            path,
            accountType: 'imported',
            networkType: network.networkType,
            coin: network.symbol,
        },
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
