import { AccountInfo } from 'trezor-connect';
import { ACCOUNT } from '@wallet-actions/constants';
import { DiscoveryItem } from '@wallet-actions/discoveryActions';
import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';
import { Dispatch, GetState, TrezorDevice } from '@suite-types';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.REMOVE; payload: Account[] }
    | { type: typeof ACCOUNT.REQUEST_NEW_ACCOUNT; payload: TrezorDevice }
    | { type: typeof ACCOUNT.CHANGE_VISIBILITY; payload: Account }
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
        page: accountInfo.page,
    },
});

export const update = (account: Account, accountInfo: AccountInfo) =>
    ({
        type: ACCOUNT.UPDATE,
        payload: {
            ...account,
            ...accountInfo,
            path: account.path, // preserve account path (fetched account comes without it)
            // immer.js (used in reducer) doesn't update fields that are set to undefined,
            // so when a marker is undefined, we change it to null.
            ...{ marker: accountInfo.marker ? accountInfo.marker : null },
        },
    } as const);

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

export const requestNewAccount = () => (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;
    dispatch({
        type: ACCOUNT.REQUEST_NEW_ACCOUNT,
        payload: device,
    });
};

export const changeAccountVisibility = (payload: Account) => ({
    type: ACCOUNT.CHANGE_VISIBILITY,
    payload,
});
