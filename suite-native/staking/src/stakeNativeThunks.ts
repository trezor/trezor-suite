import {
    type MevProtectionRootState,
    selectIsMevProtectionFeatureEnabled,
} from '@suite-common/mev';
import { createThunk } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type PushSendFormTransactionThunkDeps,
    type PushSendFormTransactionThunkState,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectIsMevProtectionEnabled,
} from '@suite-common/wallet-core';
import { type AccountKey, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { STAKE_NATIVE_MODULE_PREFIX } from './constants';
import {
    type SignEthereumStakingTransactionNativeThunkState,
    signEthereumStakingTransactionNativeThunk,
} from './stakeFormEthereumNativeThunks';
import {
    type SignSolanaStakingTransactionNativeThunkState,
    signSolanaStakingTransactionNativeThunk,
} from './stakeFormSolanaNativeThunks';
import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

const LOG_PREFIX = 'signStakeTransactionNativeThunk';
const PUSH_LOG_PREFIX = 'pushStakeTransactionNativeThunk';

export type SignStakeTransactionNativeThunkState = AccountsRootState &
    SignEthereumStakingTransactionNativeThunkState &
    SignSolanaStakingTransactionNativeThunkState;

export const signStakeTransactionNativeThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: StakeNativeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeNativeRejectValue;
        state: SignStakeTransactionNativeThunkState;
    }
>(`${STAKE_NATIVE_MODULE_PREFIX}/${LOG_PREFIX}`, async (args, thunkApi) => {
    const { accountKey } = args;
    const account = selectAccountByKey(thunkApi.getState(), accountKey);

    if (!account) {
        console.error(`${LOG_PREFIX}: Account not found.`);

        return thunkApi.rejectWithValue({
            error: 'sign-transaction-failed',
            message: 'Account not found.',
        });
    }

    if (account.networkType === 'ethereum') {
        const action = await thunkApi.dispatch(signEthereumStakingTransactionNativeThunk(args));

        if (signEthereumStakingTransactionNativeThunk.fulfilled.match(action)) {
            return action.payload;
        }

        return thunkApi.rejectWithValue(action.payload);
    }

    if (account.networkType === 'solana') {
        const action = await thunkApi.dispatch(signSolanaStakingTransactionNativeThunk(args));

        if (signSolanaStakingTransactionNativeThunk.fulfilled.match(action)) {
            return action.payload;
        }

        return thunkApi.rejectWithValue(action.payload);
    }

    console.error(`${LOG_PREFIX}: Unsupported networkType ${account.networkType}`);

    return thunkApi.rejectWithValue({
        error: 'sign-transaction-failed',
        message: `Staking is not supported for network type: ${account.networkType}`,
    });
});

export type PushStakeTransactionNativeThunkState = AccountsRootState &
    MevProtectionRootState &
    PushSendFormTransactionThunkState;
export type PushStakeTransactionNativeThunkDeps = PushSendFormTransactionThunkDeps;

export const pushStakeTransactionNativeThunk = createThunk<
    { txid: string },
    { accountKey: AccountKey },
    {
        rejectValue: SignStakeNativeRejectValue;
        state: PushStakeTransactionNativeThunkState;
        extra: PushStakeTransactionNativeThunkDeps;
    }
>(`${STAKE_NATIVE_MODULE_PREFIX}/${PUSH_LOG_PREFIX}`, async ({ accountKey }, thunkApi) => {
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
            ? selectIsMevProtectionEnabled(getState()) &&
              selectIsMevProtectionFeatureEnabled(getState())
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
});
