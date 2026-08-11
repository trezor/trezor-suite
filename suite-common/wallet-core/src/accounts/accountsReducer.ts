import { current, isAnyOf } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { networks } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { accountEqualTo, compareAccountsByCoin, enhanceHistory } from '@suite-common/wallet-utils';
import { typedObjectKeys } from '@trezor/utils';

import { accountsActions } from './accountsActions';

export type AccountsState = Account[];

export const accountsInitialState: AccountsState = [];

export type AccountsRootState = {
    wallet: {
        accounts: AccountsState;
    };
};

const findCoinjoinAccount =
    (key: string) =>
    (account: Account): account is Extract<Account, { backendType: 'coinjoin' }> =>
        account.key === key && account.backendType === 'coinjoin';

const isHistoryUnchanged = (prev: Account['history'], next: Account['history']) => {
    const keys = typedObjectKeys(prev);
    if (keys.length !== Object.keys(next).length) return false;

    return keys.every(key => prev[key] === next[key]);
};

// `history` is the only field we rebuild here (enhanceHistory), so it's always a fresh object even
// when the values are unchanged - compare it by its own keys. Every other field keeps the caller's
// reference, so a shallow (reference) compare is enough to detect a real change.
const isUnchangedAccount = (prev: Account, next: Account) => {
    const keys = typedObjectKeys(prev);
    if (keys.length !== Object.keys(next).length) return false;

    return keys.every(key =>
        key === 'history'
            ? isHistoryUnchanged(prev.history, next.history)
            : prev[key] === next[key],
    );
};

const update = (state: Account[], account: Account) => {
    const accountIndex = state.findIndex(accountEqualTo(account));
    const prev = state[accountIndex];

    if (prev) {
        const prevUnwrapped = current(prev);
        const next: Account = {
            ...account,
            // remove "transactions" field, they are stored in "transactionReducer"
            history: enhanceHistory(account.history),
        };

        if (!account.marker) {
            // immer.js doesn't update fields that are set to undefined, so instead we delete the field
            delete next.marker;
        }

        // Locally tracked tokens must survive an update built from an older account snapshot
        // (e.g. a concurrent sync). A wrapped-native (WETH) balance exists only as a local entry:
        // wrapping emits no ERC-20 Transfer, so the backend never reports the token on its own.
        if (next.networkType === 'ethereum' && prevUnwrapped.tokens?.length) {
            const nextContracts = new Set(next.tokens?.map(token => token.contract.toLowerCase()));
            const locallyTrackedTokens = prevUnwrapped.tokens.filter(
                token => !nextContracts.has(token.contract.toLowerCase()),
            );

            if (locallyTrackedTokens.length > 0) {
                next.tokens = (next.tokens ?? []).concat(locallyTrackedTokens);
            }
        }

        // Skip the write when nothing changed, so the entity reference (and the components subscribed
        // to it) stay stable. current() unwraps the immer draft, otherwise reads of nested fields
        // return proxies and the reference compare would never match.
        if (isUnchangedAccount(prevUnwrapped, next)) return;

        state[accountIndex] = next;
    } else {
        console.warn(
            // do not log the descriptor: it is confidential and would leak into Sentry breadcrumbs
            `Tried to update account that does not exist (symbol: ${account.symbol}, type: ${account.accountType}, index: ${account.index})`,
        );
    }
};

const remove = (state: Account[], accounts: Account[]) => {
    accounts.forEach(a => {
        const index = state.findIndex(accountEqualTo(a));
        // a missing account yields index -1, and splice(-1, 1) would delete the
        // last, unrelated account instead of being a no-op
        if (index !== -1) {
            state.splice(index, 1);
        }
    });
};

const setMetadata = (state: Account[], account: Account) => {
    const index = state.findIndex(a => a.key === account.key);
    if (!state[index]) return;
    state[index].metadata = account.metadata;
};

export const prepareAccountsReducer = createReducerWithExtraDeps(
    accountsInitialState,
    (builder, extra) => {
        builder
            .addCase(accountsActions.removeAccount, (state, action) => {
                remove(state, action.payload);
            })
            .addCase(accountsActions.createAccount, (state, action) => {
                const { symbol, index } = action.payload;
                const networkName = networks[symbol].name;
                const accountLabel = action.payload.accountLabel ?? `${networkName} #${index + 1}`;
                // remove "transactions" field, they are stored in "transactionReducer"
                const history = enhanceHistory(action.payload.history);

                const account = { ...action.payload, accountLabel, history };

                if (state.some(accountEqualTo(account))) {
                    console.warn(
                        // do not log the whole account: descriptor/addresses/balance are confidential and would leak into Sentry breadcrumbs
                        `Duplicated account found, updating instead (symbol: ${account.symbol}, type: ${account.accountType}, index: ${account.index})`,
                    );
                    update(state, account);
                } else {
                    // Keep the state sorted by coin so that consumers get the canonical order for free.
                    const insertAtIndex = state.findIndex(
                        existingAccount => compareAccountsByCoin(account, existingAccount) < 0,
                    );

                    if (insertAtIndex === -1) {
                        state.push(account);
                    } else {
                        state.splice(insertAtIndex, 0, account);
                    }
                }
            })
            .addCase(accountsActions.updateAccount, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.addAccountTokens, (state, action) => {
                const { accountKey, tokens } = action.payload;
                const accountByAccountKey = state.find(account => account.key === accountKey);
                if (accountByAccountKey) {
                    accountByAccountKey.tokens = (accountByAccountKey.tokens ?? []).concat(tokens);
                }
            })
            .addCase(accountsActions.renameAccount, (state, action) => {
                const { accountKey, accountLabel } = action.payload;
                const accountByAccountKey = state.find(account => account.key === accountKey);
                if (accountByAccountKey) accountByAccountKey.accountLabel = accountLabel;
            })
            .addCase(accountsActions.changeAccountVisibility, (state, action) => {
                update(state, action.payload);
            })
            .addCase(accountsActions.startCoinjoinAccountSync, (state, action) => {
                const account = state.find(findCoinjoinAccount(action.payload.accountKey));
                if (account) {
                    account.syncing = true;
                }
            })
            .addCase(accountsActions.endCoinjoinAccountSync, (state, action) => {
                const account = state.find(findCoinjoinAccount(action.payload.accountKey));
                if (account) {
                    account.syncing = undefined;
                    account.status = action.payload.status;
                }
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadAccounts)
            // Persistence of accounts and transactions in suite-native depends on device.remember state,
            // but redux-persist is not checking for changes in other reducers.
            // This is a workaround to update redux-persist state.
            .addCase(deviceActions.setRememberDevice, state => [...state])
            .addMatcher(isAnyOf(extra.actions.setAccountAddMetadata), (state, action) => {
                const { payload } = action;
                setMetadata(state, payload);
            });
    },
);
