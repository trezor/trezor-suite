import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectThpConfirmationRequestId, selectThpStep } from '@suite-common/thp';
import {
    type DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    type RootStackParamList,
    type StackToTabCompositeProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackToTabCompositeProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.ThpPairingInfo,
    RootStackParamList
>;

export const useInitiateThpConnection = () => {
    const navigation = useNavigation<NavigationProp>();

    const thpStep = useSelector(selectThpStep);
    const requestId = useSelector(selectThpConfirmationRequestId);

    const initiateThpConnection = () => {
        // Device is acquired by the FW installation hook, just respond as expected.
        TrezorConnect.uiResponse({ type: 'ui-receive_confirmation', payload: true, requestId });
    };

    useEffect(() => {
        if (thpStep === 'ConfirmConnectionBeforePairing' || thpStep === 'ConfirmOnlyConnection') {
            navigation.replace(DeviceOnboardingStackRoutes.ThpConfirmation);
        }
    }, [thpStep, navigation]);

    return { initiateThpConnection };
};
