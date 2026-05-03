import { createThunk } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { signEthereumStakingTransactionNativeThunk } from './stakeFormEthereumNativeThunks';
import {
    type EthereumStakingType,
    type SignEthereumStakingRejectValue,
} from './stakeFormEthereumNativeTypes';

const STAKE_NATIVE_MODULE_PREFIX = '@suite-native/staking';
const LOG_PREFIX = 'signStakeTransactionNativeThunk';

export const signStakeTransactionNativeThunk = createThunk<
    { txid: string },
    {
        accountKey: AccountKey;
        stakeType: EthereumStakingType;
        precomposedTransaction: PrecomposedTransactionFinal;
    },
    { rejectValue: SignEthereumStakingRejectValue }
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

    console.error(`${LOG_PREFIX}: Unsupported networkType ${account.networkType}`);

    return thunkApi.rejectWithValue({
        error: 'sign-transaction-failed',
        message: `Staking is not supported for network type: ${account.networkType}`,
    });
});
