import { type TokenAddress } from '@suite-common/tokens';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { FeeSelector, type FeeSelectorProps } from '@suite-native/transaction-management';

import { EarnCustomFeeReplacedBanner } from './EarnCustomFeeReplacedBanner';
import { EarnFeeEstimationErrorAlert } from './EarnFeeEstimationErrorAlert';

type EarnFees = Pick<
    FeeSelectorProps,
    'formDraft' | 'formDraftKey' | 'selectedFee' | 'getCustomFeeLevel' | 'onFeeConfirmed'
> & {
    hasFeeEstimationError: boolean;
    isComposingFeeLevels?: boolean;
    isCustomFeeReplaced?: boolean;
    retryFeeEstimation: () => void;
    updateFeeLevelThunk: FeeSelectorProps['updateThunk'];
};

type EarnFeeSectionProps = {
    accountKey: AccountKey;
    fees: EarnFees;
    tokenContract?: TokenAddress;
};

export const EarnFeeSection = ({ accountKey, fees, tokenContract }: EarnFeeSectionProps) => {
    if (fees.hasFeeEstimationError) {
        return <EarnFeeEstimationErrorAlert onRetry={fees.retryFeeEstimation} />;
    }

    return (
        <>
            <FeeSelector
                isLoading={fees.isComposingFeeLevels}
                accountKey={accountKey}
                tokenContract={tokenContract}
                updateThunk={fees.updateFeeLevelThunk}
                onFeeConfirmed={fees.onFeeConfirmed}
                selectedFee={fees.selectedFee}
                selectedFeePerUnit={fees.formDraft?.feePerUnit}
                formDraft={fees.formDraft}
                formDraftKey={fees.formDraftKey}
                getCustomFeeLevel={fees.getCustomFeeLevel}
            />
            {fees.isCustomFeeReplaced && (
                <Box marginTop="sp8">
                    <EarnCustomFeeReplacedBanner />
                </Box>
            )}
        </>
    );
};
