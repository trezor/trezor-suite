import { BannerFull } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

interface YieldLoadErrorAlertProps {
    onRetry: () => void;
}

export const YieldLoadErrorAlert = ({ onRetry }: YieldLoadErrorAlertProps) => {
    const { translate } = useTranslate();

    return (
        <BannerFull
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
