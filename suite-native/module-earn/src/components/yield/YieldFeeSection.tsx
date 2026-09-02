import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { FeeSelector, type FeeSelectorProps } from '@suite-native/transaction-management';

import { YieldFeeEstimationErrorAlert } from './YieldFeeEstimationErrorAlert';

type YieldFees = Pick<FeeSelectorProps, 'formDraft' | 'formDraftKey' | 'selectedFee'> & {
    hasFeeEstimationError: boolean;
    retryFeeEstimation: () => void;
    updateFeeLevelThunk: FeeSelectorProps['updateThunk'];
};

type YieldFeeSectionProps = {
    accountKey: AccountKey;
    fees: YieldFees;
    tokenContract?: TokenAddress;
};

export const YieldFeeSection = ({ accountKey, fees, tokenContract }: YieldFeeSectionProps) => {
    if (fees.hasFeeEstimationError) {
        return <YieldFeeEstimationErrorAlert onRetry={fees.retryFeeEstimation} />;
    }

    return (
        <FeeSelector
            accountKey={accountKey}
            tokenContract={tokenContract}
            updateThunk={fees.updateFeeLevelThunk}
            selectedFee={fees.selectedFee}
            selectedFeePerUnit={fees.formDraft?.feePerUnit}
            formDraft={fees.formDraft}
            formDraftKey={fees.formDraftKey}
        />
    );
};
