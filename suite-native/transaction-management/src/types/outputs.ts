import { type ReviewOutput, type ReviewOutputState } from '@suite-common/wallet-types';

export type StatefulReviewOutput = ReviewOutput & { state: ReviewOutputState };

export type ReviewSummaryOutput = {
    state: ReviewOutputState;
    totalSpent: string;
    fee: string;
};
