import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type YieldFeeEstimationErrorAlertProps = {
    onRetry: () => void;
};

export const YieldFeeEstimationErrorAlert = ({ onRetry }: YieldFeeEstimationErrorAlertProps) => (
    <InlineAlertBox
        intent="critical"
        title={<Translation id="earn.feeEstimationFailed" />}
        buttonLabel={<Translation id="generic.buttons.tryAgain" />}
        onButtonPress={onRetry}
    />
);
