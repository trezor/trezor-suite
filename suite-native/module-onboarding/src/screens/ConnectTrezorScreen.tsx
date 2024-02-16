import { Dimensions } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ConnectDeviceAnimation } from '@suite-native/device';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

const ANIMATION_HEIGHT = Dimensions.get('screen').height * 0.35;

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: '100%',
    borderColor: 'transparent',
}));

export const ConnectTrezorScreen = () => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.TrackBalances>
        >();

    const handleRedirect = () => {
        navigation.navigate(OnboardingStackRoutes.AboutReceiveCoinsFeature);
    };

    return (
        <OnboardingScreen
            title={translate('moduleOnboarding.connectTrezorScreen.title')}
            subtitle={translate('moduleOnboarding.connectTrezorScreen.subtitle')}
            activeStep={1}
            footer={
                <OnboardingFooter
                    backButtonTitle={translate('generic.buttons.back')}
                    nextButtonTitle={translate('generic.buttons.next')}
                    redirectTarget={handleRedirect}
                    onBack={navigation.goBack}
                />
            }
        >
            <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
        </OnboardingScreen>
    );
};
