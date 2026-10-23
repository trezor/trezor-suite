import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { buildClaimContract, buildClaimReviewForm } from './contracts/claimContract';
import { buildFreezeContract, buildFreezeReviewForm } from './contracts/freezeContract';
import { buildUnstakeContract, buildUnstakeReviewForm } from './contracts/unstakeContract';
import { buildVoteContract, buildVoteReviewForm } from './contracts/voteContract';
import { buildWithdrawContract, buildWithdrawReviewForm } from './contracts/withdrawContract';
import { getTronClaimableRewards, getTronWithdrawableAmount } from './tronStakingRules';
import {
    type TronStakingPlanError,
    type TronStakingStep,
    type TronStakingStepPlan,
    type TronStakingStepRequest,
} from './types';

const TRON_VOTING_SYMBOL = 'trx';

const planned = (step: TronStakingStep): TronStakingStepPlan => ({ success: true, step });

const failed = (code: TronStakingPlanError['code']): TronStakingStepPlan => ({
    success: false,
    error: { code },
});

const isPositiveAmount = (amount: string) => {
    const value = new BigNumber(amount);

    return value.isFinite() && value.gt(0);
};

export const planTronStakingStep = (
    request: TronStakingStepRequest,
    account: Account,
): TronStakingStepPlan => {
    if (account.networkType !== 'tron') return failed('UNSUPPORTED_NETWORK');

    switch (request.type) {
        case 'freeze': {
            if (!isPositiveAmount(request.amount)) return failed('INVALID_AMOUNT');

            const contract = buildFreezeContract(account, request.amount, request.resourceType);

            if (!contract) return failed('INVALID_OWNER_ADDRESS');

            return planned({
                ...request,
                contract,
                reviewForm: buildFreezeReviewForm(request.resourceType),
            });
        }
        case 'unstake': {
            if (!isPositiveAmount(request.amount)) return failed('INVALID_AMOUNT');

            const contract = buildUnstakeContract(account, request.amount, request.resourceType);

            if (!contract) return failed('INVALID_OWNER_ADDRESS');

            return planned({
                ...request,
                contract,
                reviewForm: buildUnstakeReviewForm(request.resourceType),
            });
        }
        case 'vote': {
            if (account.symbol !== TRON_VOTING_SYMBOL) return failed('VOTING_UNSUPPORTED_NETWORK');

            const allocations = request.allocations.filter(({ count }) => count > 0);
            const contract = buildVoteContract(account, allocations);

            if (!contract) return failed('INVALID_VOTE_ALLOCATION');

            return planned({
                type: 'vote',
                allocations,
                contract,
                reviewForm: buildVoteReviewForm(allocations),
            });
        }
        case 'withdraw': {
            const contract = buildWithdrawContract(account);

            if (!contract) return failed('INVALID_OWNER_ADDRESS');

            return planned({
                type: 'withdraw',
                amount: getTronWithdrawableAmount(account, Date.now() / 1000),
                contract,
                reviewForm: buildWithdrawReviewForm(),
            });
        }
        case 'claim': {
            const contract = buildClaimContract(account);

            if (!contract) return failed('INVALID_OWNER_ADDRESS');

            return planned({
                type: 'claim',
                amount: getTronClaimableRewards(account),
                contract,
                reviewForm: buildClaimReviewForm(),
            });
        }
        default:
            return exhaustive(request);
    }
};
