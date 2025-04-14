import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useSetAtom } from 'jotai';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { wasDeviceOnboardingCancelledAtom } from '@suite-native/device';
import { useFirmware } from '@suite-native/firmware';
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

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList
>;
export const useExitAlert = () => {
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const selectedDevice = useSelector(selectSelectedDevice);
    const setWasDeviceOnboardingCancelled = useSetAtom(wasDeviceOnboardingCancelledAtom);
    const { setIsFirmwareInstallationRunning } = useFirmware();

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
                    setIsFirmwareInstallationRunning(false);
                    setWasDeviceOnboardingCancelled(true);
                    navigation.navigate(RootStackRoutes.AppTabs, {
                        screen: AppTabsRoutes.HomeStack,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    });
                }
            },
        });
    }, [
        selectedDevice,
        setWasDeviceOnboardingCancelled,
        setIsFirmwareInstallationRunning,
        translate,
        showAlert,
        navigation,
    ]);

    return { handleExitButtonPress };
};
