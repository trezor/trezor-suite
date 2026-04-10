import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { useAlert } from '@suite-native/alerts';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import { useFirmware } from '@suite-native/firmware';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    type DeviceOnboardingStackParamList,
    type DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';
type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList
>;
export const useExitAlert = (handleContinueButtonPress?: () => void) => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProps>();

    const { showAlert } = useAlert();

    const { translate } = useTranslate();

    const selectedDevice = useSelector(selectSelectedDevice);
    const { setIsFirmwareInstallationRunning } = useFirmware();

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleDeviceOnboarding.cancelOnboardingAlert.title'),
            description: translate('moduleDeviceOnboarding.cancelOnboardingAlert.description'),
            primaryButtonTitle: translate(
                'moduleDeviceOnboarding.cancelOnboardingAlert.cancelButton',
            ),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            secondaryButtonTitle: translate(
                'moduleDeviceOnboarding.cancelOnboardingAlert.continueButton',
            ),
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressPrimaryButton: () => {
                if (selectedDevice) {
                    setIsFirmwareInstallationRunning(false);
                    dispatch(setWasDeviceOnboardingCancelled(true));
                    navigation.popTo(RootStackRoutes.AppTabs, {
                        screen: AppTabsRoutes.HomeStack,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    });
                    TrezorConnect.cancel();
                }
            },
            onPressSecondaryButton: () => {
                if (handleContinueButtonPress) {
                    handleContinueButtonPress();
                }
            },
        });
    }, [
        dispatch,
        handleContinueButtonPress,
        navigation,
        selectedDevice,
        setIsFirmwareInstallationRunning,
        showAlert,
        translate,
    ]);

    return { handleExitButtonPress };
};
