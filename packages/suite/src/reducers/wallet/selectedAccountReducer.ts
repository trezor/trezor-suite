import { type ConnectPopupState } from '@suite-common/connect-popup';
import { type TradingState } from '@suite-common/trading';
import {
    type AccountsRootState,
    type SendRootState,
    accountsActions,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import type { SelectedAccountStatus } from '@suite-common/wallet-types';

import { type YieldState } from 'src/reducers/wallet/yieldReducer';
import type { Action } from 'src/types/suite';

export type State = SelectedAccountStatus;

export type SelectedAccountRootState = {
    wallet: {
        selectedAccount: SelectedAccountStatus;
    };
} & AccountsRootState;

export type SelectedAccountRootStateWithTrading = SelectedAccountRootState &
    SendRootState & {
        wallet: {
            trading: TradingState;
            yield: YieldState;
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

export const selectFullSelectedAccount = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount;

export const selectSelectedAccount = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account;

export const selectSelectedAccountKey = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.account?.key;

export const selectSelectedAccountStatus = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.status;

export const selectIsSelectedAccountLoaded = (state: SelectedAccountRootState) =>
    state.wallet.selectedAccount.status === 'loaded';

/**
 * Mainly used for common modals, also used in the Trading section.
 * @returns account from yield tx review if set, then send state if set, then trading if set,
 * otherwise account from the store
 */
export const selectAccountIncludingChosenInTrading = (
    state: SelectedAccountRootStateWithTrading,
) => {
    const yieldAccountKey = state.wallet.yield.txReview.accountKey;
    if (yieldAccountKey) {
        return selectAccountByKey(state, yieldAccountKey) ?? undefined;
    }

    const sendAccountKey = state.wallet.send.accountKey;
    if (sendAccountKey) {
        return selectAccountByKey(state, sendAccountKey) ?? undefined;
    }

    const { modalAccountKey } = state.wallet.trading;
    if (modalAccountKey) {
        return selectAccountByKey(state, modalAccountKey) ?? undefined;
    }

    const { activeCall } = state.connectPopup;
    if (activeCall?.state === 'ongoing') {
        return selectAccountByKey(state, activeCall.selectedAccountKey) ?? undefined;
    }

    const selectedAccount = selectSelectedAccount(state);

    return selectedAccount;
};

export default selectedAccountReducer;
