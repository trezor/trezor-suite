import { FeeSelector, type FeeSelectorProps } from '@suite-native/transaction-management';

import { YieldFeeEstimationErrorAlert } from '../yield/YieldFeeEstimationErrorAlert';

type RetriableFeeEstimationProps = FeeSelectorProps & {
    hasFeeEstimationError: boolean;
    retryFeeEstimation: () => void;
};

export const RetriableFeeEstimation = ({
    hasFeeEstimationError,
    retryFeeEstimation,
    ...feeSelectorProps
}: RetriableFeeEstimationProps) => {
    if (hasFeeEstimationError) {
        return <YieldFeeEstimationErrorAlert onRetry={retryFeeEstimation} />;
    }

    return <FeeSelector {...feeSelectorProps} />;
};
