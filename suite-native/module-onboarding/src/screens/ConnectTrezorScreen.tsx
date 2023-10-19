import { useNavigation } from '@react-navigation/native';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Image } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';

export const ConnectTrezorScreen = () => {
    const { translate } = useTranslate();

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
            <Image source={require('../assets/trezorT.png')} resizeMode="contain" />
        </OnboardingScreen>
    );
};
