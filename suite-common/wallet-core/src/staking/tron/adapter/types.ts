import { type TrezorDevice } from '@suite-common/suite-types';
import { type StakingProductId } from '@suite-common/wallet-config';
import {
    type Account,
    type FormState,
    type PrecomposedTransaction,
    type TronResourceType,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { type TronUnstakingBatch, type TronVote } from '@trezor/blockchain-link-types';

import { type TronClaimContract } from './contracts/claimContract';
import { type TronFreezeContract } from './contracts/freezeContract';
import { type TronUnstakeContract } from './contracts/unstakeContract';
import { type TronVoteAllocation, type TronVoteContract } from './contracts/voteContract';
import { type TronWithdrawContract } from './contracts/withdrawContract';
import { type StakingProductAdapterBase } from '../../products/types';

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

type TronStakingStepBase = { contract: TronStakingContract; reviewForm: FormState };

// The step as signed: the request with only the votes that count, the TRX a withdrawal or a
// claim moves when it is planned, its contract and what the review screen shows.
export type TronStakingStep = TronStakingStepBase &
    (
        | TronFreezeStepRequest
        | TronUnstakeStepRequest
        | TronVoteStepRequest
        | { type: 'withdraw'; amount: string }
        | { type: 'claim'; amount: string }
    );

export type TronStakingPlanError =
    | { code: 'UNSUPPORTED_NETWORK' }
    | { code: 'VOTING_UNSUPPORTED_NETWORK' }
    | { code: 'INVALID_AMOUNT' }
    | { code: 'INVALID_OWNER_ADDRESS' }
    | { code: 'INVALID_VOTE_ALLOCATION' };

type TronStakingStepPlanSuccess = { success: true; step: TronStakingStep };
type TronStakingStepPlanFailure = { success: false; error: TronStakingPlanError };

export type TronStakingStepPlan = TronStakingStepPlanSuccess | TronStakingStepPlanFailure;

/** In sun, as the network estimated it for the step. */
export type TronStakingStepFee = { fee: string; feePerByte: string; bytes: number };

export type TronPendingStakingTransaction = {
    amount: string;
    type: WalletAccountTransaction['type'];
    target: { addresses: string[]; amount: string };
    tronSpecific: WalletAccountTransaction['tronSpecific'];
};

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
    getUnfreezeBatches: (account: Account) => TronUnstakingBatch[];
    /** TRX whose unfreeze has expired by the given time and can be withdrawn. */
    getWithdrawableAmount: (account: Account, nowSeconds: number) => string;
    /** TRX still unfreezing at the given time. */
    getPendingUnfreezeAmount: (account: Account, nowSeconds: number) => string;
    getClaimableRewards: (account: Account) => string;
    /** Unix seconds; null when the account never claimed its rewards. */
    getRewardClaimCooldownEndsAt: (account: Account) => number | null;
    isRewardClaimSupported: (device: TrezorDevice | undefined) => boolean;
    /** Builds one step of a flow; the vote of a stake is planned once its allocation is chosen. */
    planStep: (request: TronStakingStepRequest, account: Account) => TronStakingStepPlan;
    /** What the step spends and sends, given the fee the network estimated for it. */
    composeStepTransaction: (
        step: TronStakingStep,
        account: Account,
        fee: TronStakingStepFee,
    ) => PrecomposedTransaction;
    /** The transaction shown as pending right after the step is broadcast. */
    getPendingTransaction: (
        step: TronStakingStep,
        account: Account,
        fee: TronStakingStepFee,
    ) => TronPendingStakingTransaction;
    /** Whether the signed transaction id is reported to the earn API before the broadcast. */
    isTxidReportedBeforeBroadcast: (step: TronStakingStep) => boolean;
};
