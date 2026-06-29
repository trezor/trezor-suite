import { FullAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

type StablecoinYieldLoadErrorAlertProps = {
    onRetry: () => void;
};

export const StablecoinYieldLoadErrorAlert = ({ onRetry }: StablecoinYieldLoadErrorAlertProps) => {
    const { translate } = useTranslate();

    return (
        <FullAlertBox
            testID="@earn/stablecoin-yield-load-error-alert"
            margin="sp16"
            intent="warning"
            title={<Translation id="earn.earnScreen.stablecoinYieldLoadError.title" />}
            description={<Translation id="earn.earnScreen.stablecoinYieldLoadError.description" />}
            primaryButtonLabel={translate('generic.buttons.tryAgain')}
            onPressPrimaryButton={onRetry}
            primaryButtonProps={{
                iconLeft: 'arrowsCounterClockwise',
                testID: '@earn/stablecoin-yield-load-error-alert/retry-button',
            }}
        />
    );
};
