import TrezorConnect, { AccountInfo } from 'trezor-connect';
import { ACCOUNT } from '@wallet-actions/constants';
import { DiscoveryItem } from '@wallet-actions/discoveryActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { analyzeTransactions } from '@wallet-utils/transactionUtils';
import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import { SETTINGS } from '@suite-config';

export type AccountActions =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.REMOVE; payload: Account[] }
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
        symbol: discoveryItem.coin,
        empty: accountInfo.empty,
        visible:
            !accountInfo.empty ||
            (discoveryItem.accountType === 'normal' && discoveryItem.index === 0),
        balance: accountInfo.balance,
        availableBalance: accountInfo.availableBalance,
        formattedBalance: accountUtils.formatNetworkAmount(
            accountInfo.availableBalance,
            discoveryItem.coin,
        ),
        tokens: accountInfo.tokens?.map(t => ({
            ...t,
            symbol: t.symbol ? t.symbol.toLowerCase() : t.symbol,
            balance: t.balance ? accountUtils.formatAmount(t.balance, t.decimals) : t.balance,
        })),
        addresses: accountInfo.addresses,
        utxo: accountInfo.utxo,
        history: accountInfo.history,
        ...accountUtils.getAccountSpecific(accountInfo, discoveryItem.networkType),
    },
});

// TODO: imo we could extract payload object to seperate function and use it in create, update methods
export const update = (account: Account, accountInfo: AccountInfo): AccountActions => ({
    type: ACCOUNT.UPDATE,
    payload: {
        ...account,
        ...accountInfo,
        path: account.path,
        empty: accountInfo.empty,
        formattedBalance: accountUtils.formatNetworkAmount(
            accountInfo.availableBalance,
            account.symbol,
        ),
        tokens: accountInfo.tokens?.map(t => ({
            ...t,
            symbol: t.symbol ? t.symbol.toLowerCase() : t.symbol,
            balance: t.balance ? accountUtils.formatAmount(t.balance, t.decimals) : t.balance,
        })),
        ...accountUtils.getAccountSpecific(accountInfo, account.networkType),
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
    getState: GetState,
) => {
    // we need to fetch at least the number of unconfirmed txs
    const pageSize =
        (account.history.unconfirmed || 0) > SETTINGS.TXS_PER_PAGE
            ? account.history.unconfirmed
            : SETTINGS.TXS_PER_PAGE;
    const response = await TrezorConnect.getAccountInfo({
        coin: account.symbol,
        descriptor: account.descriptor,
        details: 'txs',
        page: 1, // useful for every network except ripple
        pageSize,
    });

    if (response.success) {
        const { payload } = response;

        const accountTxs = accountUtils.getAccountTransactions(
            getState().wallet.transactions.transactions,
            account,
        );

        const analyze = analyzeTransactions(payload.history.transactions || [], accountTxs);
        if (analyze.remove.length > 0) {
            // TODO: remove notif in middleware
            dispatch(transactionActions.remove(account, analyze.remove));
        }
        if (analyze.add.length > 0) {
            dispatch(transactionActions.add(analyze.add.reverse(), account));
        }

        const accountDevice = accountUtils.findAccountDevice(account, getState().devices);
        analyze.newTransactions.forEach(tx => {
            dispatch(
                notificationActions.addEvent({
                    type: 'tx-confirmed',
                    formattedAmount: accountUtils.formatNetworkAmount(
                        tx.amount,
                        account.symbol,
                        true,
                    ),
                    device: accountDevice,
                    descriptor: account.descriptor,
                    txid: tx.txid,
                }),
            );
        });

        if (
            analyze.remove.length > 0 ||
            analyze.add.length > 0 ||
            accountUtils.isAccountOutdated(account, payload)
        ) {
            dispatch(update(account, payload));
        }
    }
};
