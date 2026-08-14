import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DeviceRootState, selectDevices } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    type TokenDefinitionsRootState,
    selectCoinDefinitions,
} from '@suite-common/token-definitions';
import { getNetworkFeatures } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type GetTradedAccountKeysDep,
} from '@suite-common/wallet-types';
import {
    analyzeTransactions,
    findAccountDevice,
    formatNetworkAmount,
    formatTokenAmount,
    getAccountTransactions,
    getAreSatoshisUsed,
    isAccountOutdated,
    isPending,
    isTrezorConnectBackendType,
    tryGetAccountIdentity,
} from '@suite-common/wallet-utils';
import TrezorConnect, { type AccountInfo, type TokenInfo } from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';

import { reportWalletBalanceDebounced } from './accountBalanceAnalytics';
import { accountsActions } from './accountsActions';
import { ACCOUNTS_MODULE_PREFIX } from './accountsConstants';
import {
    getAccountInfoAnalyticsPayload,
    isAccountActiveForAnalytics,
} from './accountsInfoAnalytics';
import { type AccountsRootState } from './accountsReducer';
import { accountRefreshed } from './accountsRefreshTimeReducer';
import { selectAccountByKey } from './accountsSelectors';
import {
    type BlockchainRootState,
    selectBlockchainHeightBySymbol,
    selectGapLimit,
} from '../blockchain/blockchainReducer';
import {
    type WalletSettingsRootState,
    selectBitcoinAmountUnit,
} from '../settings/walletSettingsReducer';
import { transactionsActions } from '../transactions/transactionsActions';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import {
    selectEvmPrivatePendingHint,
    selectTransactions,
} from '../transactions/transactionsSelectors';

const fetchAccountTokens = async (account: Account, payloadTokens: AccountInfo['tokens']) => {
    const tokens: TokenInfo[] = [];

    // Stellar: All tokens with active trustlines are already in payload (even with 0 balance).
    if (account.networkType === 'stellar') {
        return tokens;
    }

    const isEvmNetwork = account.networkType === 'ethereum';

    // get list of tokens that are not included in default response, their balances need to be fetched
    const customTokens =
        account.tokens?.filter(
            t =>
                !payloadTokens?.some(p =>
                    isEvmNetwork
                        ? p.contract.toLowerCase() === t.contract.toLowerCase()
                        : p.contract === t.contract,
                ),
        ) ?? [];

    const promises = customTokens.map(t =>
        TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: 'tokenBalances',
            contractFilter: t.contract,
            suppressBackupWarning: true,
            protocols: isEvmNetwork ? ['erc4626'] : undefined,
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

export type ReportWalletBalanceThunkDeps = {
    services: AnalyticsDep;
};
export type ReportWalletBalanceThunkState = AccountsRootState;

export const reportWalletBalanceThunk = createThunk<
    void,
    void,
    { state: ReportWalletBalanceThunkState; extra: ReportWalletBalanceThunkDeps }
>(`${ACCOUNTS_MODULE_PREFIX}/reportWalletBalance`, (_, { getState, extra }) => {
    reportWalletBalanceDebounced({
        getState,
        analytics: extra.services.analytics,
    });
});

export type ReportAccountInfoThunkDeps = {
    services: AnalyticsDep & GetTradedAccountKeysDep;
};
export type ReportAccountInfoThunkState = AccountsRootState & TokenDefinitionsRootState;

export const reportAccountInfoThunk = createThunk<
    void,
    AccountKey,
    { state: ReportAccountInfoThunkState; extra: ReportAccountInfoThunkDeps }
>(`${ACCOUNTS_MODULE_PREFIX}/reportAccountInfo`, (accountKey, { getState, extra }) => {
    const account = selectAccountByKey(getState(), accountKey);
    if (!account || !isAccountActiveForAnalytics(account)) return;

    const tokenDefinitions = selectCoinDefinitions(getState(), account.symbol);
    // wait for token definitions before reporting, otherwise the account would be deduped with an
    // incorrect token list with phishing tokens could be reported
    const requiresTokenDefinitions = getNetworkFeatures(account.symbol).includes(
        'coin-definitions',
    );
    if (requiresTokenDefinitions && !tokenDefinitions?.data) return;

    const hasTraded = extra.services.getTradedAccountKeys().includes(account.key);

    extra.services.analytics.report({
        type: events.accountsInfoEvent.name,
        payload: getAccountInfoAnalyticsPayload(account, tokenDefinitions, hasTraded),
    });
});

// Left here for clarity, but shouldn't be called anywhere but in blockchainActions.syncAccounts
// as we usually want to update all accounts for a single coin at once
export type FetchAndUpdateAccountThunkDeps = {
    services: AnalyticsDep & GetTradedAccountKeysDep;
};
export type FetchAndUpdateAccountThunkState = AccountsRootState &
    BlockchainRootState &
    DeviceRootState &
    TokenDefinitionsRootState &
    TransactionsRootState &
    WalletSettingsRootState;
type FetchAndUpdateAccountThunkParams = {
    accountKey: AccountKey;
};

export const fetchAndUpdateAccountThunk = createThunk<
    void,
    FetchAndUpdateAccountThunkParams,
    { state: FetchAndUpdateAccountThunkState; extra: FetchAndUpdateAccountThunkDeps }
>(
    `${ACCOUNTS_MODULE_PREFIX}/fetchAndUpdateAccountThunk`,
    async ({ accountKey }, { dispatch, getState }) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account || account.failed || account.accountType === 'placeholder') return;

        if (!isTrezorConnectBackendType(account.backendType)) return; // skip unsupported backend type

        // trezor/blockbook#1639: declare our local pending txs so blockbook reports the right
        // pending nonce and serves them in history. undefined for non-EVM / nothing pending — the
        // field is then omitted.
        const privatePending = selectEvmPrivatePendingHint(getState(), account.key);

        // first basic check, traffic optimization
        // basic check returns only small amount of data without full transaction history
        const tokenAccountsPubKeys =
            account.networkType === 'solana'
                ? account.tokens?.flatMap(t => t.accounts ?? []).map(a => a.publicKey)
                : undefined;
        const gap =
            account.networkType === 'bitcoin'
                ? selectGapLimit(getState(), account.symbol)
                : undefined;

        const basic = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: account.networkType === 'solana' ? 'txids' : 'basic',
            suppressBackupWarning: true,
            tokenAccountsPubKeys,
            protocols: account.networkType === 'ethereum' ? ['erc4626'] : undefined,
            privatePending,
            gap,
        });

        if (!basic.success) return;

        const accountOutdated = isAccountOutdated(account, basic.payload);
        const accountTransactions = selectTransactions(getState());
        const accountTxs = getAccountTransactions(account.key, accountTransactions);

        // stop here if account is not outdated and there are no pending transactions

        if (!accountOutdated && !accountTxs.some(isPending)) {
            // refreshed, nothing changed - restart the throttle window (old code bumped account.ts)
            dispatch(accountRefreshed(accountKey));

            return;
        }

        // we need to fetch at least the number of unconfirmed txs
        const pageSize =
            (account.history.unconfirmed || 0) > getTxsPerPage(account.networkType)
                ? account.history.unconfirmed
                : getTxsPerPage(account.networkType);

        const response = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity: tryGetAccountIdentity(account),
            descriptor: account.descriptor,
            details: 'txs',
            page: 1, // useful for every network except ripple and stellar
            pageSize,
            suppressBackupWarning: true,
            protocols: account.networkType === 'ethereum' ? ['erc4626'] : undefined,
            privatePending,
            gap:
                account.networkType === 'bitcoin'
                    ? selectGapLimit(getState(), account.symbol)
                    : undefined,
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
                // Blockbook returns empty tokens for pending contract calls. Copy them
                // from our fake tx (identified by `deadline`) so RBF on this pending tx still
                // has token + amount.
                const enrichedAdd = analyze.add.map(freshTx => {
                    if ((freshTx.tokens?.length ?? 0) > 0) return freshTx;
                    const fakeMatch = accountTxs.find(
                        t =>
                            t?.txid === freshTx.txid &&
                            'deadline' in t &&
                            (t.tokens?.length ?? 0) > 0,
                    );

                    return fakeMatch ? { ...freshTx, tokens: fakeMatch.tokens } : freshTx;
                });

                dispatch(
                    transactionsActions.addTransaction({
                        transactions: enrichedAdd.reverse(),
                        account,
                    }),
                );
            }

            const devices = selectDevices(getState());
            const accountDevice = findAccountDevice(account, devices);
            analyze.newTransactions.forEach(tx => {
                const token = tx.tokens?.[0];

                const bitcoinAmountUnit = selectBitcoinAmountUnit(getState());
                const areSatoshisUsed = getAreSatoshisUsed(bitcoinAmountUnit, account);

                const formattedAmount = token
                    ? formatTokenAmount(token)
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
                // updateAccount restarts the throttle window via the accountsRefreshTime slice
                // (mirrors old account.ts)
                dispatch(accountsActions.updateAccount(account, payload));
                dispatch(reportAccountInfoThunk(account.key));
            } else {
                // refreshed, nothing changed - restart the throttle window directly
                dispatch(accountRefreshed(accountKey));
            }

            dispatch(reportWalletBalanceThunk());
        }
    },
);
