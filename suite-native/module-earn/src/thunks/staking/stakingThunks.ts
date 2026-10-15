import {
    type AccountsRootState,
    type PushStakeTransactionError,
    type PushStakeTransactionThunkDeps,
    type PushStakeTransactionThunkState,
    type SendRootState,
    pushStakeTransactionThunk,
    selectAccountByKey,
    selectPrecomposedSendForm,
    selectSendPrecomposedTx,
    selectSendSerializedTx,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import {
    type SignEthereumStakingTransactionThunkState,
    signEthereumStakingTransactionThunk,
} from './ethereumStakingThunks';
import {
    type SignSolanaStakingTransactionThunkState,
    signSolanaStakingTransactionThunk,
} from './solanaStakingThunks';
import { EARN_MODULE_PREFIX } from '../../constants';
import { type SignStakeTransactionRejectValue } from '../../types';

const LOG_PREFIX = 'signStakeTransactionThunk';

export type SignStakeTransactionThunkState = AccountsRootState &
    SignEthereumStakingTransactionThunkState &
    SignSolanaStakingTransactionThunkState;

export const signStakeTransactionThunk = createThunk<
    void,
    {
        accountKey: AccountKey;
        stakeType: BaseStakeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    {
        rejectValue: SignStakeTransactionRejectValue;
        state: SignStakeTransactionThunkState;
    }
>(`${EARN_MODULE_PREFIX}/${LOG_PREFIX}`, async (args, thunkApi) => {
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
        const action = await thunkApi.dispatch(signEthereumStakingTransactionThunk(args));

        if (signEthereumStakingTransactionThunk.fulfilled.match(action)) {
            return action.payload;
        }

        return thunkApi.rejectWithValue(action.payload);
    }

    if (account.networkType === 'solana') {
        const action = await thunkApi.dispatch(signSolanaStakingTransactionThunk(args));

        if (signSolanaStakingTransactionThunk.fulfilled.match(action)) {
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

const PUSH_LOG_PREFIX = 'pushSignedStakeTransactionThunk';

export type PushSignedStakeTransactionThunkState = PushStakeTransactionThunkState & SendRootState;

export type PushSignedStakeTransactionThunkDeps = PushStakeTransactionThunkDeps;

// Broadcasts the staking transaction signed during the deferred sign, which the mobile review
// flow keeps in the send slice.
export const pushSignedStakeTransactionThunk = createThunk<
    { txid: string },
    { accountKey: AccountKey; stakeType: BaseStakeType; isMevProtectionFeatureEnabled: boolean },
    {
        rejectValue: PushStakeTransactionError;
        state: PushSignedStakeTransactionThunkState;
        extra: PushSignedStakeTransactionThunkDeps;
    }
>(
    `${EARN_MODULE_PREFIX}/${PUSH_LOG_PREFIX}`,
    async ({ accountKey, stakeType, isMevProtectionFeatureEnabled }, thunkApi) => {
        const { dispatch, getState, rejectWithValue } = thunkApi;
        const serializedTx = selectSendSerializedTx(getState());
        const precomposedTransaction = selectSendPrecomposedTx(getState());
        const precomposedForm = selectPrecomposedSendForm(getState());

        if (!serializedTx || !precomposedTransaction) {
            console.error(`${PUSH_LOG_PREFIX}: Signed transaction not found.`);

            return rejectWithValue({
                error: 'push-transaction-failed',
                metadata: {
                    success: false,
                    error: { message: 'Transaction not found.', code: 'Failure_UnknownCode' },
                },
            });
        }

        const action = await dispatch(
            pushStakeTransactionThunk({
                accountKey,
                stakeType,
                serializedTx,
                precomposedTransaction,
                precomposedForm,
                isMevProtectionFeatureEnabled,
            }),
        );

        if (pushStakeTransactionThunk.fulfilled.match(action)) {
            return action.payload;
        }

        return rejectWithValue(action.payload);
    },
);
