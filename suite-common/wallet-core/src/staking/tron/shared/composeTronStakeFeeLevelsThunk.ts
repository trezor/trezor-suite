import {
    type Account,
    type PrecomposedLevels,
    type TronResourceType,
} from '@suite-common/wallet-types';
import { createThunk } from '@trezor/redux-utils';

import { TRON_STAKE_MODULE } from './constants';
import { composeTronClaimFeeLevelsThunk } from '../actions/claim/composeClaim';
import { composeTronFreezeFeeLevelsThunk } from '../actions/freeze/composeFreeze';
import { composeTronUnstakeFeeLevelsThunk } from '../actions/unstake/composeUnstake';
import { composeTronVoteFeeLevelsThunk } from '../actions/vote/composeVote';
import { type TronVoteAllocation } from '../actions/vote/voteContract';
import { composeTronWithdrawFeeLevelsThunk } from '../actions/withdraw/composeWithdraw';

export type TronStakeFeeRequest =
    | { step: 'freeze' | 'unstake'; amount: string; resourceType: TronResourceType }
    | { step: 'vote'; allocations: TronVoteAllocation[] }
    | { step: 'withdraw' | 'claim' };

export const composeTronStakeFeeLevelsThunk = createThunk<
    PrecomposedLevels,
    { account: Account; request: TronStakeFeeRequest },
    void
>(
    `${TRON_STAKE_MODULE}/composeTronStakeFeeLevelsThunk`,
    ({ account, request }, { dispatch, signal }) => {
        const options = { signal };

        switch (request.step) {
            case 'freeze':
                return dispatch(
                    composeTronFreezeFeeLevelsThunk(
                        { account, amount: request.amount, resourceType: request.resourceType },
                        options,
                    ),
                ).unwrap();
            case 'unstake':
                return dispatch(
                    composeTronUnstakeFeeLevelsThunk(
                        { account, amount: request.amount, resourceType: request.resourceType },
                        options,
                    ),
                ).unwrap();
            case 'vote':
                return dispatch(
                    composeTronVoteFeeLevelsThunk(
                        { account, allocations: request.allocations },
                        options,
                    ),
                ).unwrap();
            case 'withdraw':
                return dispatch(composeTronWithdrawFeeLevelsThunk({ account }, options)).unwrap();
            case 'claim':
                return dispatch(composeTronClaimFeeLevelsThunk({ account }, options)).unwrap();
        }
    },
);
