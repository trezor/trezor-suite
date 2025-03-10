import { useDispatch } from 'react-redux';

import { CommonActions } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';

import { TextButton } from '@suite-native/atoms';
import { HomeStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { setIsOnboardingFinished } from '@suite-native/settings';

export const E2ESkipOnboardingButton = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const redirectToHome = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            }),
        );

        // Timeout is needed to ensure that navigation event already finished before changing  the redux state.
        // Situation when app was still focused on the onboarding screen but the state was already change made e2e tests flaky.
        setTimeout(() => dispatch(setIsOnboardingFinished()), 500);
    };

    return (
        <TextButton
            onPress={redirectToHome}
            variant="tertiary"
            testID="@onboarding/e2eSkipOnboarding"
        >
            E2E:Skip onboarding
        </TextButton>
    );
};
