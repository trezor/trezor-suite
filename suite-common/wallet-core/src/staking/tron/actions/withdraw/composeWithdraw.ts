import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { buildWithdrawContract } from './withdrawContract';
import { composeTronStakingFeeLevels } from '../../shared/composeTronStakingFeeLevels';
import {
    TRON_DUMMY_BLOCK_HASH,
    TRON_DUMMY_BLOCK_HEIGHT,
    TRON_STAKE_MODULE,
} from '../../shared/constants';
import { type TronStakeError } from '../../tronStakingTypes';

export interface WithdrawThunkArguments {
    account: Account;
}

export const composeTronWithdrawFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    WithdrawThunkArguments,
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/composeTronWithdrawFeeLevelsThunk`,
    async ({ account }, { rejectWithValue }) => {
        if (account.networkType !== 'tron') {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid network type.' });
        }

        const contract = buildWithdrawContract(account);

        if (!contract) {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid owner address.' });
        }

        const estimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: TRON_DUMMY_BLOCK_HASH,
            blockHeight: TRON_DUMMY_BLOCK_HEIGHT,
        });

        if (!estimate.success) {
            return rejectWithValue({ kind: 'compose-failed', message: estimate.error.message });
        }

        return composeTronStakingFeeLevels({ account, bytes: estimate.payload.bandwidth });
    },
);
