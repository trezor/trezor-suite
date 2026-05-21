import { createThunk } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { STAKE_NATIVE_MODULE_PREFIX } from './constants';
import { signEthereumStakingTransactionNativeThunk } from './stakeFormEthereumNativeThunks';
import { signSolanaStakingTransactionNativeThunk } from './stakeFormSolanaNativeThunks';
import { type SignStakeNativeRejectValue, type StakeNativeType } from './stakeNativeTypes';

const LOG_PREFIX = 'signStakeTransactionNativeThunk';

export const signStakeTransactionNativeThunk = createThunk<
    { txid: string },
    {
        accountKey: AccountKey;
        stakeType: StakeNativeType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    { rejectValue: SignStakeNativeRejectValue }
>(`${STAKE_NATIVE_MODULE_PREFIX}/${LOG_PREFIX}`, async (args, thunkApi) => {
    const { accountKey } = args;
    const account = selectAccountByKey(thunkApi.getState() as AccountsRootState, accountKey);

    if (!account) {
        console.error(`${LOG_PREFIX}: Account not found for key ${accountKey}`);

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
