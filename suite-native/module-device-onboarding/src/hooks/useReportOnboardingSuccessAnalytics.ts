import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { useServices } from '@suite-common/dependency-injection';
import {
    selectDeviceModel,
    selectIsDeviceBackupRequired,
    selectIsDeviceProtectedByPin,
} from '@suite-common/device';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';

import { onboardingAnalyticsAtom } from '../../atoms';

export const useReportOnboardingSuccessAnalytics = () => {
    const deviceModel = useSelector(selectDeviceModel);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);
    const onboardingAnalytics = useAtomValue(onboardingAnalyticsAtom);
    const { analytics } = useServices(selectNativeAnalyticsDep);

    return useCallback(() => {
        analytics.report({
            type: events.deviceSetupCompletedEvent.name,
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
