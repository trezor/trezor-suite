import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import {
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackNavigationProps<
    FirmwareUpdateStackParamList,
    FirmwareUpdateStackRoutes.FirmwareInstallation
>;

export const useInitiateThpConnection = () => {
    const navigation = useNavigation<NavigationProp>();

    const thpStep = useSelector(selectThpStep);
    const device = useSelector(selectSelectedDevice);

    const initiateThpConnection = useCallback(() => {
        if (!device) return;
        // Device is acquired by the FW installation hook, just respond as expected.
        TrezorConnect.uiResponse({
            type: 'ui-receive_confirmation',
            payload: true,
            device: { path: device.path },
        });
    }, [device]);

    useEffect(() => {
        if (thpStep === 'ConfirmOnlyConnection') {
            navigation.navigate(FirmwareUpdateStackRoutes.ThpConfirmation);
        }
    }, [thpStep, navigation]);

    return {
        initiateThpConnection,
    };
};
