import { createThunk } from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';

import { STAKE_MODULE_PREFIX } from './stakingActions';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectAccountByKey } from '../accounts/accountsSelectors';
import {
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    pushSendFormTransactionThunk,
} from '../send/sendFormThunks';
import { type PushTransactionError, type SignTransactionError } from '../send/sendFormTypes';
import {
    type WalletSettingsRootState,
    selectIsMevProtectionEnabled,
} from '../settings/walletSettingsReducer';

const PUSH_LOG_PREFIX = 'pushStakeTransactionThunk';

export type PushStakeTransactionError = SignTransactionError | PushTransactionError | undefined;

export type PushStakeTransactionThunkState = AccountsRootState &
    WalletSettingsRootState &
    PushSendFormTransactionThunkState;

export type PushStakeTransactionThunkDeps = PushSendFormTransactionThunkDeps;

export const pushStakeTransactionThunk = createThunk<
    { txid: string },
    // MEV protection availability is app-specific (message-system feature flag), so the caller
    // resolves it (e.g. via `selectIsMevProtectionFeatureEnabled` from `@suite-common/mev`).
    { accountKey: AccountKey; isMevProtectionFeatureEnabled: boolean },
    {
        rejectValue: PushStakeTransactionError;
        state: PushStakeTransactionThunkState;
        extra: PushStakeTransactionThunkDeps;
    }
>(
    `${STAKE_MODULE_PREFIX}/${PUSH_LOG_PREFIX}`,
    async ({ accountKey, isMevProtectionFeatureEnabled }, thunkApi) => {
        const { dispatch, getState, rejectWithValue } = thunkApi;
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) {
            console.error(`${PUSH_LOG_PREFIX}: Account not found.`);

            return rejectWithValue({
                error: 'sign-transaction-failed',
                message: 'Account not found.',
            });
        }

        const isMevProtectionEnabled =
            account.networkType === 'ethereum'
                ? selectIsMevProtectionEnabled(getState()) && isMevProtectionFeatureEnabled
                : false;

        const pushAction = await dispatch(
            pushSendFormTransactionThunk({ selectedAccount: account, isMevProtectionEnabled }),
        );

        if (pushSendFormTransactionThunk.rejected.match(pushAction)) {
            console.error(
                `${PUSH_LOG_PREFIX}: Push transaction failed with code: ${pushAction.payload?.error}`,
            );

            return rejectWithValue(pushAction.payload);
        }

        return { txid: pushAction.payload.payload.txid };
    },
);
