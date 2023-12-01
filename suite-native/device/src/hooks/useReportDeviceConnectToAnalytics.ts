import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { analytics, EventType } from '@suite-native/analytics';
import {
    selectDeviceFirmwareVersion,
    selectDeviceLanguage,
    selectDeviceModel,
    selectIsDeviceBitcoinOnly,
    selectIsDeviceProtectedByPin,
} from '@suite-common/wallet-core';

import { selectIsDeviceReadyToUseAndAuthorized } from '../selectors';

export const useReportDeviceConnectToAnalytics = () => {
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const deviceFirmwareVersion = useSelector(selectDeviceFirmwareVersion);
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);
    const deviceModel = useSelector(selectDeviceModel);
    const isDeviceBitcoinOnly = useSelector(selectIsDeviceBitcoinOnly);
    const deviceLanguage = useSelector(selectDeviceLanguage);

    useEffect(() => {
        if (isDeviceReadyToUseAndAuthorized) {
            analytics.report({
                type: EventType.ConnectDevice,
                payload: {
                    firmwareVersion: deviceFirmwareVersion,
                    pinProtection: isDeviceProtectedByPin,
                    deviceModel,
                    isBitcoinOnly: isDeviceBitcoinOnly,
                    deviceLanguage,
                },
            });
        }
    }, [
        deviceFirmwareVersion,
        deviceLanguage,
        deviceModel,
        isDeviceBitcoinOnly,
        isDeviceProtectedByPin,
        isDeviceReadyToUseAndAuthorized,
    ]);
};
