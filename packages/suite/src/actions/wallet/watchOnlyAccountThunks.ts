import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type AccountsRootState, accountsActions, selectAccounts } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import {
    getNextWatchOnlyAccountIndex,
    prepareWatchOnlyAccountPayload,
} from '@suite-common/wallet-utils';
import { createThunk } from '@trezor/redux-utils';

const WATCH_ONLY_ACCOUNT_THUNK_PREFIX = '@suite/wallet/watchOnlyAccount';

type AddWatchOnlyAccountThunkState = AccountsRootState & NetworksRootState;

type AddWatchOnlyAccountThunkDeps = { services: DesktopAnalyticsDep };

export const addWatchOnlyAccountThunk = createThunk<
    Account | undefined,
    { address: string; symbol: NetworkSymbol; device: TrezorDevice },
    { state: AddWatchOnlyAccountThunkState; extra: AddWatchOnlyAccountThunkDeps }
>(
    `${WATCH_ONLY_ACCOUNT_THUNK_PREFIX}/add`,
    async ({ address, symbol, device }, { dispatch, getState, extra }) => {
        const deviceState = device.state?.staticSessionId;
        if (!deviceState) return undefined;

        const newAccount = await prepareWatchOnlyAccountPayload({
            address,
            networkSymbol: symbol,
            index: getNextWatchOnlyAccountIndex(selectAccounts(getState()), {
                symbol,
                deviceState,
            }),
            device,
        });

        if (newAccount instanceof Error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'discovery-error',
                    error: newAccount.message,
                }),
            );

            return undefined;
        }

        const createAccountAction = accountsActions.createAccount(
            newAccount,
            selectSupportedNetworkSymbols(getState()),
        );
        dispatch(createAccountAction);
        extra.services.analytics.report({
            type: events.accountsWatchAccountAddedEvent.name,
            payload: { symbol },
        });
        dispatch(
            notificationsActions.addToast({
                type: 'account-added',
                networkName: getNetwork(symbol).name,
            }),
        );

        return createAccountAction.payload.account;
    },
);

type RemoveWatchOnlyAccountThunkState = void;

type RemoveWatchOnlyAccountThunkDeps = { services: DesktopAnalyticsDep };

export const removeWatchOnlyAccountThunk = createThunk<
    void,
    { account: Account },
    { state: RemoveWatchOnlyAccountThunkState; extra: RemoveWatchOnlyAccountThunkDeps }
>(`${WATCH_ONLY_ACCOUNT_THUNK_PREFIX}/remove`, ({ account }, { dispatch, extra }) => {
    dispatch(accountsActions.removeAccount([account]));
    extra.services.analytics.report({
        type: events.accountsWatchAccountRemovedEvent.name,
        payload: { symbol: account.symbol },
    });
});
