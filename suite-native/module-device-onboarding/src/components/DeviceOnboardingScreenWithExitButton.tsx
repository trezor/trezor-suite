import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useSetAtom } from 'jotai';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Box } from '@suite-native/atoms';
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
    Screen,
    ScreenHeader,
    ScreenProps,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    RootStackParamList
>;

const DeviceOnboardingExitButtonScreenHeader = () => {
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

    useEffect(() => {
        // Override default navigation GO_BACK action to align it with the exit button behavior.
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
                handleExitButtonPress();
            }
        });

        return unsubscribe;
    }, [handleExitButtonPress, navigation]);

    return <ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />;
};

export const DeviceOnboardingScreenWithExitButton = ({ children, ...screenProps }: ScreenProps) => (
    <Screen header={<DeviceOnboardingExitButtonScreenHeader />} {...screenProps}>
        <Box flex={1} marginVertical="sp16">
            {children}
        </Box>
    </Screen>
);
