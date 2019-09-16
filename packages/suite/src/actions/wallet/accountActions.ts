import { AccountInfo } from 'trezor-connect';
// import { Dispatch, GetState } from '@suite-types/index';
import { ACCOUNT } from '@wallet-actions/constants';
import { DiscoveryItem } from '@wallet-actions/discoveryActions';
import { Account } from '@wallet-types';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.UPDATE; payload: Account };

export const create = (
    deviceState: string,
    discoveryItem: DiscoveryItem,
    accountInfo: AccountInfo,
): AccountActions => ({
    type: ACCOUNT.CREATE,
    payload: {
        deviceState,
        index: discoveryItem.index,
        path: discoveryItem.path,
        descriptor: accountInfo.descriptor,
        accountType: discoveryItem.accountType,
        networkType: discoveryItem.networkType,
        symbol: discoveryItem.coin,
        empty: accountInfo.empty,
        visible: true,
        balance: accountInfo.balance,
        availableBalance: accountInfo.availableBalance,
        tokens: accountInfo.tokens,
        addresses: accountInfo.addresses,
        utxo: accountInfo.utxo,
        history: accountInfo.history,
        misc: accountInfo.misc,
        marker: accountInfo.marker,
    },
});
