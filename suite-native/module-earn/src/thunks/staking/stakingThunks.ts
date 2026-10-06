import { createThunk } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type BaseStakeType,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

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
