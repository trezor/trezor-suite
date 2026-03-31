import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectThpConfirmationRequestId, selectThpStep } from '@suite-common/thp';
import {
    type FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.FirmwareInstallation
>;

export const useInitiateThpConnection = () => {
    const navigation = useNavigation<NavigationProp>();

    const thpStep = useSelector(selectThpStep);
    const requestId = useSelector(selectThpConfirmationRequestId);

    const initiateThpConnection = useCallback(() => {
        // Device is acquired by the FW installation hook, just respond as expected.
        TrezorConnect.uiResponse({ type: 'ui-receive_confirmation', payload: true, requestId });
    }, [requestId]);

    useEffect(() => {
        if (thpStep === 'ConfirmOnlyConnection') {
            navigation.navigate(FirmwareUpdateStackRoutes.ThpConfirmation);
        }
    }, [thpStep, navigation]);

    return {
        initiateThpConnection,
    };
};
