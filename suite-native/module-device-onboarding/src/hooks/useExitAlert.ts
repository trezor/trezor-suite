import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';

import { deviceActions, selectIsThpDevice, selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { setWasDeviceOnboardingCancelled } from '@suite-native/device-onboarding';
import { selectIsFirmwareInstallationRunning, useFirmware } from '@suite-native/firmware';
import { useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
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
    const isThpDevice = useSelector(selectIsThpDevice);
    const { setIsFirmwareInstallationRunning } = useFirmware();

    const isFirmwareInstallationRunning = useSelector(selectIsFirmwareInstallationRunning);

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleDeviceOnboarding.cancelOnboardingAlert.title'),
            description: translate('moduleDeviceOnboarding.cancelOnboardingAlert.description'),
            primaryButtonTitle: translate(
                'moduleDeviceOnboarding.cancelOnboardingAlert.cancelButton',
            ),
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: translate(
                'moduleDeviceOnboarding.cancelOnboardingAlert.continueButton',
            ),
            secondaryButtonVariant: 'redElevation0',
            onPressPrimaryButton: () => {
                if (selectedDevice) {
                    TrezorConnect.cancel();

                    if (isThpDevice && isFirmwareInstallationRunning) {
                        dispatch(deviceActions.deviceDisconnect(selectedDevice));
                    }

                    setIsFirmwareInstallationRunning(false);
                    dispatch(setWasDeviceOnboardingCancelled(true));
                    navigation.popTo(RootStackRoutes.AppTabs, {
                        screen: AppTabsRoutes.HomeStack,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    });
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
        isFirmwareInstallationRunning,
        isThpDevice,
        navigation,
        selectedDevice,
        setIsFirmwareInstallationRunning,
        showAlert,
        translate,
    ]);

    return { handleExitButtonPress };
};
