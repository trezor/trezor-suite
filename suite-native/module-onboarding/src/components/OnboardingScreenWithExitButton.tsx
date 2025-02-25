import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/core';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    Screen,
    ScreenHeader,
    ScreenProps,
} from '@suite-native/navigation';

const OnboardingExitButtonScreenHeader = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const selectedDevice = useSelector(selectSelectedDevice);

    const handleCancelOnboarding = () => {
        showAlert({
            title: translate('moduleOnboarding.cancelOnboardingAlert.title'),
            description: translate('moduleOnboarding.cancelOnboardingAlert.description'),
            primaryButtonTitle: translate('generic.buttons.cancel'),
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: translate(
                'moduleOnboarding.cancelOnboardingAlert.continueButton',
            ),
            secondaryButtonVariant: 'redElevation0',
            onPressPrimaryButton: () => {
                if (selectedDevice) {
                    dispatch(deviceActions.deviceDisconnect(selectedDevice));
                    navigation.dispatch(
                        CommonActions.reset({
                            index: 1,
                            routes: [
                                {
                                    name: RootStackRoutes.AppTabs,
                                    params: {
                                        screen: HomeStackRoutes.Home,
                                    },
                                },
                                {
                                    name: RootStackRoutes.AuthorizeDeviceStack,
                                    params: {
                                        screen: AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
                                    },
                                },
                            ],
                        }),
                    );
                }
            },
        });
    };

    return <ScreenHeader closeActionType="close" closeAction={handleCancelOnboarding} />;
};

export const OnboardingScreenWithExitButton = ({ children, ...screenProps }: ScreenProps) => (
    <Screen header={<OnboardingExitButtonScreenHeader />} {...screenProps}>
        {children}
    </Screen>
);
