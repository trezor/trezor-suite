import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import {
    selectDeviceModel,
    selectIsDeviceBackupRequired,
    selectIsDeviceProtectedByPin,
} from '@suite-common/wallet-core';
import { EventType } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { onboardingAnalyticsAtom } from '../../atoms';

export const useReportOnboardingSuccessAnalytics = () => {
    const deviceModel = useSelector(selectDeviceModel);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);
    const onboardingAnalytics = useAtomValue(onboardingAnalyticsAtom);
    const analytics = useAnalytics();

    return useCallback(() => {
        analytics.report({
            type: EventType.DeviceSetupCompleted,
            payload: {
                deviceModel,
                osName: Platform.OS,
                wasBackupSkipped: isDeviceBackupRequired,
                wasPinSkipped: !isDeviceProtectedByPin,
                duration: onboardingAnalytics.startTimestamp
                    ? Date.now() - onboardingAnalytics.startTimestamp
                    : undefined,
                ...onboardingAnalytics,
            },
        });
    }, [
        deviceModel,
        isDeviceBackupRequired,
        isDeviceProtectedByPin,
        analytics,
        onboardingAnalytics,
    ]);
};
