import TrezorConnect, { AccountInfo } from 'trezor-connect';
import { ACCOUNT } from '@wallet-actions/constants';
import { DiscoveryItem } from '@wallet-actions/discoveryActions';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { NETWORKS } from '@wallet-config';
import { Account, Network } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import { SETTINGS } from '@suite-config';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.REMOVE; payload: Account[] }
    | { type: typeof ACCOUNT.CHANGE_VISIBILITY; payload: Account }
    | { type: typeof ACCOUNT.UPDATE; payload: Account };

const getAccountSpecific = (accountInfo: AccountInfo, networkType: Network['networkType']) => {
    const { misc } = accountInfo;
    if (networkType === 'ripple') {
        return {
            networkType,
            misc: {
                sequence: misc && misc.sequence ? misc.sequence : 0,
                reserve: misc && misc.reserve ? misc.reserve : '0',
            },
            marker: accountInfo.marker,
            page: undefined,
        };
    }

    if (networkType === 'ethereum') {
        return {
            networkType,
            misc: {
                nonce: misc && misc.nonce ? misc.nonce : '0',
            },
            marker: undefined,
            page: accountInfo.page,
        };
    }

    return {
        networkType,
        misc: undefined,
        marker: undefined,
        page: accountInfo.page,
    };
};

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
        symbol: discoveryItem.coin,
        // empty: accountInfo.empty,
        empty: accountInfo.empty,
        visible:
            !accountInfo.empty ||
            (discoveryItem.accountType === 'normal' && discoveryItem.index === 0),
        balance: accountInfo.balance,
        availableBalance: accountInfo.availableBalance,
        formattedBalance: formatNetworkAmount(accountInfo.availableBalance, discoveryItem.coin),
        tokens: accountInfo.tokens,
        addresses: accountInfo.addresses,
        utxo: accountInfo.utxo,
        history: accountInfo.history,
        ...getAccountSpecific(accountInfo, discoveryItem.networkType),
    },
});

export const update = (account: Account, accountInfo: AccountInfo): AccountActions => ({
    type: ACCOUNT.UPDATE,
    payload: {
        ...account,
        ...accountInfo,
        path: account.path,
        empty: accountInfo.empty,
        formattedBalance: formatNetworkAmount(accountInfo.availableBalance, account.symbol),
        ...getAccountSpecific(accountInfo, account.networkType),
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

export const changeAccountVisibility = (payload: Account) => ({
    type: ACCOUNT.CHANGE_VISIBILITY,
    payload,
});

export const fetchAndUpdateAccount = (account: Account) => async (
    dispatch: Dispatch,
    _getState: GetState,
) => {
    const response = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        descriptor: account.descriptor,
        details: 'txs',
        pageSize: SETTINGS.TXS_PER_PAGE,
    });

    if (response.success) {
        dispatch(update(account, response.payload));
    }
};
