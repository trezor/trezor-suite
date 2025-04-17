import { ConnectPopupState } from '@suite-common/connect-popup';
import { TradingState as TradingNewState } from '@suite-common/trading';
import { AccountsRootState, accountsActions, selectAccountByKey } from '@suite-common/wallet-core';
import type { SelectedAccountStatus } from '@suite-common/wallet-types';

import { State as TradingState } from 'src/reducers/wallet/tradingReducer';
import type { Action } from 'src/types/suite';

export type State = SelectedAccountStatus;

export type SelectedAccountRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
    };
} & AccountsRootState;

export type SelectedAccountRootStateWithTrading = SelectedAccountRootState & {
    wallet: {
        trading: TradingState;
        tradingNew: TradingNewState;
    };
    connectPopup: ConnectPopupState;
};

export const initialState: State = {
    status: 'none',
};

const selectedAccountReducer = (state: State = initialState, action: Action): State => {
    if (accountsActions.updateSelectedAccount.match(action)) return action.payload;
    if (accountsActions.disposeAccount.match(action)) return initialState;

    return state;
};

export const selectSelectedAccount = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account;

export const selectSelectedAccountKey = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account?.key;

export const selectSelectedAccountStatus = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.status;

export const selectSelectedAccountBalance = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account?.formattedBalance;

export const selectSelectedAccountParams = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.params;

export const selectIsSelectedAccountLoaded = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.status === 'loaded';

/**
 * Mainly used for common modals, also used in the Trading section.
 * @returns account from trading if it's set, otherwise account from the store
 */
export const selectAccountIncludingChosenInTrading = (
    state: SelectedAccountRootStateWithTrading,
) => {
    const { modalAccountKey } = state.wallet.trading;
    const { modalAccountKey: modalAccountKeyNew } = state.wallet.tradingNew;

    // TODO: trading - temporary solution, should not be in the conflict
    if (modalAccountKey) {
        return selectAccountByKey(state, modalAccountKey) ?? undefined;
    }

    if (modalAccountKeyNew) {
        return selectAccountByKey(state, modalAccountKeyNew) ?? undefined;
    }

    const { activeCall } = state.connectPopup;
    if (activeCall?.state === 'ongoing') {
        return selectAccountByKey(state, activeCall.selectedAccountKey) ?? undefined;
    }

    const selectedAccount = selectSelectedAccount(state);

    return selectedAccount;
};

export default selectedAccountReducer;
