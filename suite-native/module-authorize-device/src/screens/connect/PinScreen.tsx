import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { selectDeviceModel } from '@suite-common/device';
import {
    DeviceAuthorizationStep,
    PinOnKeypad,
    selectDeviceAuthorizationStep,
} from '@suite-native/device-authorization';
import {
    type AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    type StackNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { PinOnDevice } from '../../components/connect/PinOnDevice';

type NavigationProp = StackNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PinMatrix
>;

export const PinScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const deviceAuthorizationStep = useSelector(selectDeviceAuthorizationStep);
    const navigation = useNavigation<NavigationProp>();
    const deviceModel = useSelector(selectDeviceModel);

    const onSuccess = useCallback(() => {
        navigateToInitialScreen();
    }, [navigateToInitialScreen]);

    useFocusEffect(
        useCallback(() => {
            if (deviceAuthorizationStep === DeviceAuthorizationStep.Idle) {
                navigation.goBack();
            } else if (deviceAuthorizationStep === DeviceAuthorizationStep.PassphraseRequested) {
                navigation.popTo(AuthorizeDeviceStackRoutes.PassphraseForm);
            } else if (
                deviceAuthorizationStep === DeviceAuthorizationStep.ContinueOnTrezorRequested
            ) {
                navigation.popTo(AuthorizeDeviceStackRoutes.ContinueOnTrezor);
            }
        }, [deviceAuthorizationStep, navigation]),
    );

    if (!deviceModel) return null;

    return (
        <ConnectDeviceScreenView>
            {deviceModel === DeviceModelInternal.T1B1 ? (
                <PinOnKeypad variant="current" onSuccess={onSuccess} />
            ) : (
                <PinOnDevice deviceModel={deviceModel} />
            )}
        </ConnectDeviceScreenView>
    );
};
