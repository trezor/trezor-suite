import { AccountInfo } from 'trezor-connect';
// import { Dispatch, GetState } from '@suite-types/index';
import { ACCOUNT } from '@wallet-actions/constants';
import { DiscoveryItem } from '@wallet-actions/discoveryActions';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import { NETWORKS } from '@suite-config';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.REMOVE; payload: Account[] }
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
        visible: !accountInfo.empty,
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

export const disableAccounts = () => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    // find disabled networks
    const disabledNetworks = NETWORKS.filter(
        n => !enabledNetworks.includes(n.symbol) || n.isHidden,
    ).map(n => n.symbol);
    // find accounts for disabled networks
    const accountsToRemove = getState().wallet.accounts.filter(a =>
        disabledNetworks.includes(a.symbol),
    );
    dispatch({
        type: ACCOUNT.REMOVE,
        payload: accountsToRemove,
    });
};
