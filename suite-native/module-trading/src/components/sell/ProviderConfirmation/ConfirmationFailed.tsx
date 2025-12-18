import { FadeIn, FadeOut } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import { AnimatedBox, FullAlertBox } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const ConfirmationFailed = () => {
    const { translate } = useTranslate();
    const { goBack } = useNavigation();

    return (
        <AnimatedBox entering={FadeIn} exiting={FadeOut} paddingTop="sp16">
            <FullAlertBox
                title={
                    <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.title" />
                }
                description={
                    <Translation id="moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.description" />
                }
                primaryButtonLabel={translate(
                    'moduleTrading.tradingSellPreviewScreen.providerStatus.cannotBeCompletedAlert.button',
                )}
                onPressPrimaryButton={goBack}
                iconName="info"
                variant="neutral"
            />
        </AnimatedBox>
    );
};
