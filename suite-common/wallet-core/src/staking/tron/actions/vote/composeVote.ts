import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { type TronVoteAllocation, buildVoteContract } from './voteContract';
import { composeTronStakingFeeLevels } from '../../shared/composeTronStakingFeeLevels';
import {
    TRON_DUMMY_BLOCK_HASH,
    TRON_DUMMY_BLOCK_HEIGHT,
    TRON_STAKE_MODULE,
} from '../../shared/constants';
import { type TronStakeError } from '../../tronStakingTypes';

export interface VoteThunkArguments {
    account: Account;
    allocations: TronVoteAllocation[];
}

export const composeTronVoteFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    VoteThunkArguments,
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/composeTronVoteFeeLevelsThunk`,
    async ({ account, allocations }, { rejectWithValue }) => {
        if (account.networkType !== 'tron') {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid network type.' });
        }

        const votedAllocations = allocations.filter(({ count }) => count > 0);
        const contract = buildVoteContract(account, votedAllocations);

        if (!contract) {
            return rejectWithValue({
                kind: 'compose-failed',
                message: 'Invalid vote allocation.',
            });
        }

        const estimate = await TrezorConnect.tronComposeTransaction({
            contract,
            blockHash: TRON_DUMMY_BLOCK_HASH,
            blockHeight: TRON_DUMMY_BLOCK_HEIGHT,
        });

        if (!estimate.success) {
            return rejectWithValue({ kind: 'compose-failed', message: estimate.error.message });
        }

        return composeTronStakingFeeLevels({
            account,
            bytes: estimate.payload.bandwidth,
            outputs: votedAllocations.map(({ address }) => ({ address, amount: '0' })),
        });
    },
);
