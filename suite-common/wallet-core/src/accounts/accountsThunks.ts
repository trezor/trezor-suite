import TrezorConnect, { AccountInfo, TokenInfo } from '@trezor/connect';
import { Account, AccountKey } from '@suite-common/wallet-types';
import { networksCompatibility as NETWORKS } from '@suite-common/wallet-config';
import {
    analyzeTransactions,
    findAccountDevice,
    formatAmount,
    formatNetworkAmount,
    getAccountTransactions,
    getAreSatoshisUsed,
    isAccountOutdated,
    isPending,
    isTrezorConnectBackendType,
} from '@suite-common/wallet-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { createThunk } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';

import { transactionsActions } from '../transactions/transactionsActions';
import { selectTransactions } from '../transactions/transactionsReducer';
import { accountsActions } from './accountsActions';
import { selectAccountByKey, selectAccounts } from './accountsReducer';
import { accountsActionsPrefix } from './constants';
import { selectBlockchainHeightBySymbol } from '../blockchain/blockchainReducer';

export const disableAccountsThunk = createThunk(
    `${accountsActionsPrefix}/disableAccountsThunk`,
    (_, { dispatch, extra, getState }) => {
        const {
            selectors: { selectEnabledNetworks },
        } = extra;
        const accounts = selectAccounts(getState());
        const enabledNetworks = selectEnabledNetworks(getState());
        // find disabled networks
        const disabledNetworks = NETWORKS.filter(
            n => !enabledNetworks.includes(n.symbol) || n.isHidden,
        ).map(n => n.symbol);
        // find accounts for disabled networks
        const accountsToRemove = accounts.filter(a => disabledNetworks.includes(a.symbol));

        if (accountsToRemove.length) {
            dispatch(accountsActions.removeAccount(accountsToRemove));
        }
    },
);

const fetchAccountTokens = async (account: Account, payloadTokens: AccountInfo['tokens']) => {
    const tokens: TokenInfo[] = [];
    // get list of tokens that are not included in default response, their balances need to be fetched
    const customTokens =
        account.tokens?.filter(t => !payloadTokens?.find(p => p.contract === t.contract)) ?? [];

    const promises = customTokens.map(t =>
        TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'tokenBalances',
            contractFilter: t.contract,
            suppressBackupWarning: true,
        }),
    );

    const results = await Promise.all(promises);

    results.forEach(res => {
        if (res.success && res.payload.tokens) {
            tokens.push(...res.payload.tokens);
        }
    });

    return tokens;
};

// Left here for clarity, but shouldn't be called anywhere but in blockchainActions.syncAccounts
// as we usually want to update all accounts for a single coin at once
export const fetchAndUpdateAccountThunk = createThunk(
    `${accountsActionsPrefix}/fetchAndUpdateAccountThunk`,
    async ({ accountKey }: { accountKey: AccountKey }, { dispatch, extra, getState }) => {
        const {
            selectors: { selectDevices, selectBitcoinAmountUnit },
        } = extra;
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) return;
        if (!isTrezorConnectBackendType(account.backendType)) return; // skip unsupported backend type
        // first basic check, traffic optimization
        // basic check returns only small amount of data without full transaction history
        const basic = await TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'basic',
            suppressBackupWarning: true,
        });
        if (!basic.success) return;

        const accountOutdated = isAccountOutdated(account, basic.payload);
        const accountTransactions = selectTransactions(getState());
        const accountTxs = getAccountTransactions(account.key, accountTransactions);
        // stop here if account is not outdated and there are no pending transactions
        if (!accountOutdated && !accountTxs.find(isPending)) return;

        // we need to fetch at least the number of unconfirmed txs
        const pageSize =
            (account.history.unconfirmed || 0) > getTxsPerPage(account.networkType)
                ? account.history.unconfirmed
                : getTxsPerPage(account.networkType);

        const response = await TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'txs',
            page: 1, // useful for every network except ripple
            pageSize,
            suppressBackupWarning: true,
        });

        if (response.success) {
            const { payload } = response;
            const blockHeight = selectBlockchainHeightBySymbol(getState(), account.symbol);

            const analyze = analyzeTransactions(payload.history.transactions || [], accountTxs, {
                blockHeight,
            });

            if (analyze.remove.length > 0) {
                dispatch(transactionsActions.removeTransaction({ account, txs: analyze.remove }));
            }
            if (analyze.add.length > 0) {
                dispatch(
                    transactionsActions.addTransaction({
                        transactions: analyze.add.reverse(),
                        account,
                    }),
                );
            }

            const devices = selectDevices(getState());
            const accountDevice = findAccountDevice(account, devices);
            analyze.newTransactions.forEach(tx => {
                const token = tx.tokens && tx.tokens.length ? tx.tokens[0] : undefined;

                const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());
                const areSatoshisUsed = getAreSatoshisUsed(bitcoinAmountUnit, account);

                const formattedAmount = token
                    ? `${formatAmount(token.amount, token.decimals)} ${token.symbol.toUpperCase()}`
                    : formatNetworkAmount(tx.amount, account.symbol, true, areSatoshisUsed);
                dispatch(
                    notificationsActions.addEvent({
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
            const customTokens = await fetchAccountTokens(account, payload.tokens);
            payload.tokens =
                customTokens.length > 0
                    ? (payload.tokens || []).concat(customTokens)
                    : payload.tokens;

            if (
                analyze.remove.length > 0 ||
                analyze.add.length > 0 ||
                isAccountOutdated(account, payload) ||
                customTokens.length > 0
            ) {
                dispatch(accountsActions.updateAccount(account, payload));
            }
        }
    },
);
