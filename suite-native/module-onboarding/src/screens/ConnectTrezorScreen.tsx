import { Dimensions } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { ConnectDeviceAnimation } from '@suite-native/device';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

const ANIMATION_SCALE = 0.35;
const ANIMATION_HEIGHT = Dimensions.get('screen').height * ANIMATION_SCALE;
const ANIMATION_WIDTH = Dimensions.get('screen').width * ANIMATION_SCALE;

const animationStyle = prepareNativeStyle(() => ({
    // Both height and width has to be set https://github.com/lottie-react-native/lottie-react-native/blob/master/MIGRATION-5-TO-6.md#updating-the-style-props
    height: ANIMATION_HEIGHT,
    width: ANIMATION_WIDTH,
    borderColor: 'transparent',
}));

export const ConnectTrezorScreen = () => {
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
            title={<Translation id="moduleOnboarding.connectTrezorScreen.title" />}
            subtitle={<Translation id="moduleOnboarding.connectTrezorScreen.subtitle" />}
            activeStep={1}
            footer={
                <OnboardingFooter
                    backButtonTitle={<Translation id="generic.buttons.back" />}
                    nextButtonTitle={<Translation id="generic.buttons.next" />}
                    redirectTarget={handleRedirect}
                    onBack={navigation.goBack}
                />
            }
        >
            <ConnectDeviceAnimation style={applyStyle(animationStyle)} />
        </OnboardingScreen>
    );
};
