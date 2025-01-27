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
