import { FeeLevelLabel, ReviewOutput, ReviewOutputState } from '@suite-common/wallet-types';

export type StatefulReviewOutput = ReviewOutput & { state: ReviewOutputState };

// TODO: add 'custom' in next send flow iteration
export type NativeSupportedFeeLevel = Exclude<FeeLevelLabel, 'custom' | 'low'>;
