import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected, selectSelectedDevice } from '@suite-common/wallet-core';
import { DeviceAuthenticityCheckResult, EventType, analytics } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;
export const useDeviceAuthenticityAction = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const device = useSelector(selectSelectedDevice);
    const reportCheckResult = useCallback(
        (result: DeviceAuthenticityCheckResult) =>
            analytics.report({
                type: EventType.DeviceSettingsAuthenticityCheck,
                payload: { result },
            }),
        [],
    );
    const checkAuthenticity = useCallback(async () => {
        navigation.navigate(DeviceStackRoutes.DeviceAuthenticity);

        const result = await requestPrioritizedDeviceAccess({
            deviceCallback: () =>
                TrezorConnect.authenticateDevice({
                    device: {
                        path: device?.path,
                    },
                }),
        });
        if (!result.success) {
            return;
        }

        const { success, payload } = result.payload;
        if (success) {
            const checkResult = payload.valid ? 'successful' : 'compromised';
            const configExpired = payload.error === 'CA_PUBKEY_NOT_FOUND' && payload.configExpired;
            navigation.navigate(DeviceAuthenticityStackRoutes.AuthenticitySummary, {
                checkResult: configExpired ? 'successful' : checkResult,
            });
            reportCheckResult(configExpired ? 'configExpired' : checkResult);
        } else {
            const errorCode = payload.code;
            if (errorCode === 'Failure_ActionCancelled' || errorCode === 'Failure_PinCancelled') {
                navigation.goBack();
                reportCheckResult('cancelled');
            } else if (errorCode === 'Method_Interrupted' || errorCode === undefined) {
                // navigation.goBack() already called via the X button (or the device was disconnected)
                reportCheckResult('cancelled');
            } else {
                navigation.navigate(DeviceAuthenticityStackRoutes.AuthenticitySummary, {
                    checkResult: 'compromised',
                });
                reportCheckResult('failed');
            }
        }
    }, [device, navigation, reportCheckResult]);

    useEffect(() => {
        if (isDeviceConnected) checkAuthenticity();

        // checkAuthenticity is excluded as it depends on device object that could unintentionally trigger the useEffect
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDeviceConnected]);
};
