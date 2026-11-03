import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type EarnFeeEstimationErrorAlertProps = {
    onRetry: () => void;
};

export const EarnFeeEstimationErrorAlert = ({ onRetry }: EarnFeeEstimationErrorAlertProps) => (
    <BannerInline
        intent="critical"
        title={<Translation id="earn.feeEstimationFailed" />}
        buttonLabel={<Translation id="generic.buttons.tryAgain" />}
        onButtonPress={onRetry}
    />
);
