import { ReviewOutput, ReviewOutputState } from '@suite-common/wallet-types';

export type StatefulReviewOutput = ReviewOutput & { state: ReviewOutputState };
