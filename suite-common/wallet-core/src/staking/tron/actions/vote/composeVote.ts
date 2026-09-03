import { createThunk } from '@suite-common/redux-utils';
import {
    type Account,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { computeBandwidthFeeLevel } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { buildVoteContract } from './voteContract';
import {
    TRON_DUMMY_BLOCK_HASH,
    TRON_DUMMY_BLOCK_HEIGHT,
    TRON_STAKE_MODULE,
} from '../../shared/constants';
import { type TronStakeError } from '../../tronStakingTypes';

export interface VoteThunkArguments {
    account: Account;
    representativeAddress: string;
}

export const composeTronVoteFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    VoteThunkArguments,
    { rejectValue: TronStakeError }
>(
    `${TRON_STAKE_MODULE}/composeTronVoteFeeLevelsThunk`,
    async ({ account, representativeAddress }, { rejectWithValue }) => {
        if (account.networkType !== 'tron') {
            return rejectWithValue({ kind: 'compose-failed', message: 'Invalid network type.' });
        }

        const contract = buildVoteContract(account, representativeAddress);

        if (!contract) {
            return rejectWithValue({
                kind: 'compose-failed',
                message: 'Invalid representative address.',
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

        const bytes = estimate.payload.bandwidth;

        const feeLevel = computeBandwidthFeeLevel({
            availableStakedBandwidth: account.misc.tronResources?.availableStakedBandwidth ?? 0,
            availableFreeBandwidth: account.misc.tronResources?.availableFreeBandwidth ?? 0,
            bytes,
        });

        const feeInSun = feeLevel.feePerTx || '0';

        if (new BigNumber(account.availableBalance).lt(feeInSun)) {
            return { normal: { type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' } };
        }

        const tx: PrecomposedTransactionFinal = {
            type: 'final',
            totalSpent: feeInSun,
            fee: feeInSun,
            feePerByte: feeLevel.feePerUnit ?? '0',
            bytes,
            inputs: [],
            outputs: [{ address: representativeAddress, amount: '0' }],
            outputsPermutation: [0],
        };

        return { normal: tx };
    },
);
