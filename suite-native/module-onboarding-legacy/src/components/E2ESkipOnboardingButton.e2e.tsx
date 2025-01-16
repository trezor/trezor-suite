import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/core';

import { setIsOnboardingFinished } from '@suite-native/settings';
import { HomeStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { TextButton } from '@suite-native/atoms';

export const E2ESkipOnboardingButton = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const redirectToHome = () => {
        dispatch(setIsOnboardingFinished());

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
