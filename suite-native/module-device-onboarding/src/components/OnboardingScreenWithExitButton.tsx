import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useSetAtom } from 'jotai';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { wasDeviceDisconnectedByUserActionAtom } from '@suite-native/device';
import { useFirmware } from '@suite-native/firmware';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader, ScreenProps } from '@suite-native/navigation';

const DeviceOnboardingExitButtonScreenHeader = () => {
    const navigation = useNavigation();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const setWasDeviceDisconnectedByUserAction = useSetAtom(wasDeviceDisconnectedByUserActionAtom);
    const { setIsFirmwareInstallationRunning } = useFirmware();

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleDeviceOnboarding.cancelOnboardingAlert.title'),
            description: translate('moduleDeviceOnboarding.cancelOnboardingAlert.description'),
            primaryButtonTitle: translate('generic.buttons.cancel'),
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: translate(
                'moduleDeviceOnboarding.cancelOnboardingAlert.continueButton',
            ),
            secondaryButtonVariant: 'redElevation0',
            onPressPrimaryButton: () => {
                if (selectedDevice) {
                    setIsFirmwareInstallationRunning(false);
                    setWasDeviceDisconnectedByUserAction(true);
                    dispatch(deviceActions.deviceDisconnect(selectedDevice));
                }
            },
        });
    }, [
        dispatch,
        selectedDevice,
        setWasDeviceDisconnectedByUserAction,
        setIsFirmwareInstallationRunning,
        translate,
        showAlert,
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
        {children}
    </Screen>
);
