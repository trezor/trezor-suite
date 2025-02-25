import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/core';
import { useSetAtom } from 'jotai';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { wasDeviceDisconnectedByUserActionAtom } from '@suite-native/device';
import { useTranslate } from '@suite-native/intl';
import { Screen, ScreenHeader, ScreenProps } from '@suite-native/navigation';

const OnboardingExitButtonScreenHeader = () => {
    const navigation = useNavigation();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const selectedDevice = useSelector(selectSelectedDevice);
    const setWasDeviceDisconnectedByUserAction = useSetAtom(wasDeviceDisconnectedByUserActionAtom);

    const handleExitButtonPress = useCallback(() => {
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
                    setWasDeviceDisconnectedByUserAction(true);
                    dispatch(deviceActions.deviceDisconnect(selectedDevice));
                }
            },
        });
    }, [dispatch, selectedDevice, setWasDeviceDisconnectedByUserAction, translate, showAlert]);

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

export const OnboardingScreenWithExitButton = ({ children, ...screenProps }: ScreenProps) => (
    <Screen header={<OnboardingExitButtonScreenHeader />} {...screenProps}>
        {children}
    </Screen>
);
