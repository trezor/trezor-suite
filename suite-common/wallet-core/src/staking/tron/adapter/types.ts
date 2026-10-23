import { type TrezorDevice } from '@suite-common/suite-types';
import { type StakingProductId } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type TronResourceType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type TronVote } from '@trezor/blockchain-link-types';

import { type StakingProductAdapterBase } from '../../products/types';
import { type TronClaimContract } from '../actions/claim/claimContract';
import { type TronFreezeContract } from '../actions/freeze/freezeContract';
import { type TronUnstakeContract } from '../actions/unstake/unstakeContract';
import { type TronVoteAllocation, type TronVoteContract } from '../actions/vote/voteContract';
import { type TronWithdrawContract } from '../actions/withdraw/withdrawContract';

export type TronStakingOperation = 'freeze' | 'unfreeze' | 'vote' | 'withdraw' | 'claim';

export type TronStakingTxClassification = {
    operation: TronStakingOperation;
    /** Products whose Super Representatives the transaction votes for; empty for account-wide operations. */
    productIds: StakingProductId[];
};

export type TronStakingContract =
    | TronFreezeContract
    | TronUnstakeContract
    | TronVoteContract
    | TronWithdrawContract
    | TronClaimContract;

type TronFreezeStepRequest = { type: 'freeze'; amount: string; resourceType: TronResourceType };
type TronUnstakeStepRequest = { type: 'unstake'; amount: string; resourceType: TronResourceType };
type TronVoteStepRequest = { type: 'vote'; allocations: TronVoteAllocation[] };
type TronWithdrawStepRequest = { type: 'withdraw' };
type TronClaimStepRequest = { type: 'claim' };

export type TronStakingStepRequest =
    | TronFreezeStepRequest
    | TronUnstakeStepRequest
    | TronVoteStepRequest
    | TronWithdrawStepRequest
    | TronClaimStepRequest;

// The step as signed: the request with only the votes that count, its contract and what the
// review screen shows.
export type TronStakingStep = TronStakingStepRequest & {
    contract: TronStakingContract;
    reviewForm: FormState;
};

export type TronStakingPlanError =
    | { code: 'UNSUPPORTED_NETWORK' }
    | { code: 'VOTING_UNSUPPORTED_NETWORK' }
    | { code: 'INVALID_AMOUNT' }
    | { code: 'INVALID_OWNER_ADDRESS' }
    | { code: 'INVALID_VOTE_ALLOCATION' };

type TronStakingStepPlanSuccess = { success: true; step: TronStakingStep };
type TronStakingStepPlanFailure = { success: false; error: TronStakingPlanError };

export type TronStakingStepPlan = TronStakingStepPlanSuccess | TronStakingStepPlanFailure;

/** In TRX; one vote per whole TRX. */
export type TronVotingPower = { total: string; available: string };

export type TronStakingProductAdapter = StakingProductAdapterBase<'tron'> & {
    readonly unstakingPeriodDays: number;
    classifyTransaction: (tx: WalletAccountTransaction) => TronStakingTxClassification | null;
    /** The account's votes in the order the network reports them. */
    getVotes: (account: Account) => TronVote[];
    getVotingPower: (account: Account) => TronVotingPower;
    /** Whole votes the account can cast in total. */
    getCastableVotes: (account: Account) => number;
    /** The current votes as whole-vote allocations, leaving out those without counted power. */
    getVoteAllocations: (account: Account) => TronVoteAllocation[];
    /** Unix seconds; null when the account never claimed its rewards. */
    getRewardClaimCooldownEndsAt: (account: Account) => number | null;
    isRewardClaimSupported: (device: TrezorDevice | undefined) => boolean;
    /** Builds one step of a flow; the vote of a stake is planned once its allocation is chosen. */
    planStep: (request: TronStakingStepRequest, account: Account) => TronStakingStepPlan;
};
