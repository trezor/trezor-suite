import { useNavigation } from '@react-navigation/native';

import {
    OnboardingStackParamList,
    OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Button, Card, Stack, Text, VStack } from '@suite-native/atoms';
import { Link } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { analytics } from '@suite-native/analytics';

import { OnboardingScreen } from '../components/OnboardingScreen';
import { AnalyticsInfoRow } from '../components/AnalyticsInfoRow';

const buttonsWrapperStyle = prepareNativeStyle(() => ({
    width: '90%',
    alignSelf: 'center',
}));

const analyticsConsentStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
}));

const PrivacyDescription = () => (
    <Text variant="hint" color="textSubdued">
        We value privacy and security above all. Learn more about our data and security protocols{' '}
        <Link href="https://trezor.io/" label="here" />.
    </Text>
);

export const AnalyticsConsentScreen = () => {
    const navigation =
        useNavigation<
            StackNavigationProps<OnboardingStackParamList, OnboardingStackRoutes.AnalyticsConsent>
        >();
    const { applyStyle } = useNativeStyles();

    const handleRedirect = () => {
        navigation.navigate(OnboardingStackRoutes.GetStarted);
    };

    const handleAnalyticsConsent = () => {
        analytics.enable();
        handleRedirect();
    };

    return (
        <OnboardingScreen title="User data consent" activeStep={3} isScrollable>
            <VStack style={applyStyle(analyticsConsentStyle)}>
                <Card>
                    <Stack spacing="large" paddingBottom="medium">
                        <AnalyticsInfoRow
                            iconName="eyeSlash"
                            title="Data we collect is anonymous"
                            description="We never collect identifying personal data."
                        />
                        <AnalyticsInfoRow
                            iconName="bugBeetle"
                            title="What we collect"
                            description="We gather info on application performance, visitor interaction, and potential technical issues to create a better user experience."
                        />
                        <AnalyticsInfoRow
                            iconName="lock"
                            title="We’re privacy junkies"
                            description={<PrivacyDescription />}
                        />
                    </Stack>
                </Card>
                <Stack spacing="small" style={applyStyle(buttonsWrapperStyle)}>
                    <Button testID="@onboarding/UserDataConsent/reject" onPress={handleRedirect}>
                        Not now
                    </Button>
                    <Button
                        testID="@onboarding/UserDataConsent/allow"
                        onPress={handleAnalyticsConsent}
                    >
                        Allow anonymous data collection
                    </Button>
                </Stack>
            </VStack>
        </OnboardingScreen>
    );
};
