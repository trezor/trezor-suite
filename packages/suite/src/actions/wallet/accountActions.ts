import TrezorConnect, { AccountInfo } from 'trezor-connect';
import { ACCOUNT } from '@wallet-actions/constants';
import { DiscoveryItem } from '@wallet-actions/discoveryActions';
import * as notificationActions from '@suite-actions/notificationActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as tokenActions from '@wallet-actions/tokenActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { analyzeTransactions, isPending } from '@wallet-utils/transactionUtils';
import { NETWORKS } from '@wallet-config';
import { Account } from '@wallet-types';
import { Dispatch, GetState } from '@suite-types';
import { SETTINGS } from '@suite-config';

export type AccountAction =
    | { type: typeof ACCOUNT.CREATE; payload: Account }
    | { type: typeof ACCOUNT.REMOVE; payload: Account[] }
    | { type: typeof ACCOUNT.CHANGE_VISIBILITY; payload: Account }
    | { type: typeof ACCOUNT.UPDATE; payload: Account };

export const create = (
    deviceState: string,
    discoveryItem: DiscoveryItem,
    accountInfo: AccountInfo,
): AccountAction => ({
    type: ACCOUNT.CREATE,
    payload: {
        deviceState,
        index: discoveryItem.index,
        path: discoveryItem.path,
        descriptor: accountInfo.descriptor,
        key: `${accountInfo.descriptor}-${discoveryItem.coin}-${deviceState}`,
        accountType: discoveryItem.accountType,
        symbol: discoveryItem.coin,
        empty: accountInfo.empty,
        visible:
            !accountInfo.empty ||
            (discoveryItem.accountType === 'normal' && discoveryItem.index === 0),
        balance: accountInfo.balance,
        availableBalance: accountInfo.availableBalance,
        formattedBalance: accountUtils.formatNetworkAmount(
            // xrp `availableBalance` is reduced by reserve, use regular balance
            discoveryItem.networkType === 'ripple'
                ? accountInfo.balance
                : accountInfo.availableBalance,
            discoveryItem.coin,
        ),
        tokens: accountUtils.enhanceTokens(accountInfo.tokens),
        addresses: accountUtils.enhanceAddresses(
            accountInfo.addresses,
            discoveryItem.networkType,
            discoveryItem.index,
        ),
        utxo: accountUtils.enhanceUtxo(
            accountInfo.utxo,
            discoveryItem.networkType,
            discoveryItem.index,
        ),
        history: accountInfo.history,
        metadata: {
            key: accountInfo.legacyXpub || accountInfo.descriptor,
            fileName: '',
            aesKey: '',
            outputLabels: {},
            addressLabels: {},
        },
        ...accountUtils.getAccountSpecific(accountInfo, discoveryItem.networkType),
    },
});

export const update = (account: Account, accountInfo: AccountInfo): AccountAction => ({
    type: ACCOUNT.UPDATE,
    payload: {
        ...account,
        ...accountInfo,
        path: account.path,
        empty: accountInfo.empty,
        visible: account.visible || !accountInfo.empty,
        formattedBalance: accountUtils.formatNetworkAmount(
            // xrp `availableBalance` is reduced by reserve, use regular balance
            account.networkType === 'ripple' ? accountInfo.balance : accountInfo.availableBalance,
            account.symbol,
        ),
        utxo: accountUtils.enhanceUtxo(accountInfo.utxo, account.networkType, account.index),
        addresses: accountUtils.enhanceAddresses(
            accountInfo.addresses,
            account.networkType,
            account.index,
        ),
        tokens: accountUtils.enhanceTokens(accountInfo.tokens),
        ...accountUtils.getAccountSpecific(accountInfo, account.networkType),
    },
});

export const updateAccount = (payload: Account): AccountAction => ({
    type: ACCOUNT.UPDATE,
    payload,
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

    if (accountsToRemove.length) {
        dispatch({
            type: ACCOUNT.REMOVE,
            payload: accountsToRemove,
        });
    }
};

export const changeAccountVisibility = (payload: Account, visible = true): AccountAction => ({
    type: ACCOUNT.CHANGE_VISIBILITY,
    payload: {
        ...payload,
        visible,
    },
});

export const fetchAndUpdateAccount =
    (account: Account) => async (dispatch: Dispatch, getState: GetState) => {
        // first basic check, traffic optimization
        // basic check returns only small amount of data without full transaction history
        const basic = await TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'basic',
        });
        if (!basic.success) return;

        const accountOutdated = accountUtils.isAccountOutdated(account, basic.payload);
        const accountTxs = accountUtils.getAccountTransactions(
            getState().wallet.transactions.transactions,
            account,
        );
        // stop here if account is not outdated and there are no pending transactions
        if (!accountOutdated && !accountTxs.find(isPending)) return;

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

            const analyze = analyzeTransactions(payload.history.transactions || [], accountTxs);

            if (account.networkType === 'cardano') {
                // filter out cardano pending tx as they are added manually and backend never returns them
                // if tx got confirmed then it will be added as part of analyze.add array and replaced in reducer
                // (TRANSACTION.ADD will replace the tx if tx with same txid already exists)
                analyze.remove = analyze.remove.filter(tx => !!tx.blockHeight);
            }

            if (analyze.remove.length > 0) {
                dispatch(transactionActions.remove(account, analyze.remove));
            }
            if (analyze.add.length > 0) {
                dispatch(transactionActions.add(analyze.add.reverse(), account));
            }

            const accountDevice = accountUtils.findAccountDevice(account, getState().devices);
            analyze.newTransactions.forEach(tx => {
                const token = tx.tokens && tx.tokens.length ? tx.tokens[0] : undefined;
                const formattedAmount = token
                    ? `${accountUtils.formatAmount(
                          token.amount,
                          token.decimals,
                      )} ${token.symbol.toUpperCase()}`
                    : accountUtils.formatNetworkAmount(tx.amount, account.symbol, true);
                dispatch(
                    notificationActions.addEvent({
                        type: 'tx-confirmed',
                        formattedAmount,
                        device: accountDevice,
                        descriptor: account.descriptor,
                        symbol: account.symbol,
                        txid: tx.txid,
                    }),
                );
            });

            // add custom tokens into the account.tokens
            const customTokens = await tokenActions.fetchAccountTokens(account, payload.tokens);
            payload.tokens =
                customTokens.length > 0
                    ? (payload.tokens || []).concat(customTokens)
                    : payload.tokens;

            if (
                analyze.remove.length > 0 ||
                analyze.add.length > 0 ||
                accountUtils.isAccountOutdated(account, payload) ||
                customTokens.length > 0
            ) {
                dispatch(update(account, payload));
            }
        }
    };
