import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { analytics, EventType } from '@suite-native/analytics';
import {
    selectDeviceFirmwareVersion,
    selectDeviceLanguage,
    selectDeviceModel,
    selectHasBitcoinOnlyFirmware,
    selectIsDeviceProtectedByPin,
} from '@suite-common/wallet-core';

import { selectIsDeviceReadyToUseAndAuthorized } from '../selectors';

export const useReportDeviceConnectToAnalytics = () => {
    const isDeviceReadyToUseAndAuthorized = useSelector(selectIsDeviceReadyToUseAndAuthorized);
    const deviceFirmwareVersion = useSelector(selectDeviceFirmwareVersion);
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);
    const deviceModel = useSelector(selectDeviceModel);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const deviceLanguage = useSelector(selectDeviceLanguage);

    useEffect(() => {
        if (isDeviceReadyToUseAndAuthorized) {
            analytics.report({
                type: EventType.ConnectDevice,
                payload: {
                    firmwareVersion: deviceFirmwareVersion,
                    pinProtection: isDeviceProtectedByPin,
                    deviceModel,
                    isBitcoinOnly: hasBitcoinOnlyFirmware,
                    deviceLanguage,
                },
            });
        }
    }, [
        deviceFirmwareVersion,
        deviceLanguage,
        deviceModel,
        hasBitcoinOnlyFirmware,
        isDeviceProtectedByPin,
        isDeviceReadyToUseAndAuthorized,
    ]);
};
