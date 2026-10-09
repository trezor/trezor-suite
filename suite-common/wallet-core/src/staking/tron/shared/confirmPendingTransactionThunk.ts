import { type AccountKey } from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';
import { resolveAfter } from '@trezor/utils';

import { TRON_STAKE_MODULE } from './constants';
import {
    type AccountsRefreshTimeRootState,
    selectAccountRefreshTime,
} from '../../../accounts/accountsRefreshTimeReducer';
import {
    type FetchAndUpdateAccountThunkDeps,
    type FetchAndUpdateAccountThunkState,
    fetchAndUpdateAccountThunk,
} from '../../../accounts/accountsThunks';
import { tronStakeActions } from '../tronStakingReducer';
import { type TronFlow } from '../tronStakingTypes';

const MAX_FAILED_REFRESH_RETRIES = 3;

export type ConfirmTronPendingTransactionThunkState = AccountsRefreshTimeRootState &
    FetchAndUpdateAccountThunkState;

export type ConfirmTronPendingTransactionThunkDeps = FetchAndUpdateAccountThunkDeps;

type ConfirmTronPendingTransactionThunkArguments = {
    accountKey: AccountKey;
    flow: TronFlow;
    txid: string;
    retryDelayMs: number;
};

export const confirmTronPendingTransactionThunk = createThunk<
    void,
    ConfirmTronPendingTransactionThunkArguments,
    {
        state: ConfirmTronPendingTransactionThunkState;
        extra: ConfirmTronPendingTransactionThunkDeps;
    }
>(
    `${TRON_STAKE_MODULE}/confirmTronPendingTransactionThunk`,
    async ({ accountKey, flow, txid, retryDelayMs }, { dispatch, getState }) => {
        const refreshTimeAtConfirmation = selectAccountRefreshTime(getState(), accountKey) ?? 0;

        for (let attempt = 0; attempt <= MAX_FAILED_REFRESH_RETRIES; attempt++) {
            await dispatch(fetchAndUpdateAccountThunk({ accountKey }));

            const hasAccountRefreshed =
                (selectAccountRefreshTime(getState(), accountKey) ?? 0) > refreshTimeAtConfirmation;

            if (hasAccountRefreshed) {
                break;
            }

            if (attempt < MAX_FAILED_REFRESH_RETRIES) {
                await resolveAfter(retryDelayMs);
            }
        }

        dispatch(tronStakeActions.pendingTransactionConfirmed({ accountKey, flow, txid }));
    },
);
