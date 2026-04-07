import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { useAtomValue } from 'jotai';

import { selectDeviceModel, selectIsDeviceBackupRequired } from '@suite-common/device';
import { events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';

import { onboardingAnalyticsAtom } from '../../atoms';

export const useReportOnboardingSuccessAnalytics = () => {
    const deviceModel = useSelector(selectDeviceModel);
    const isDeviceBackupRequired = useSelector(selectIsDeviceBackupRequired);
    const onboardingAnalytics = useAtomValue(onboardingAnalyticsAtom);
    const analytics = useAnalytics();

    return useCallback(
        ({ wasPinSkipped }: { wasPinSkipped: boolean }) => {
            analytics.report({
                type: events.deviceSetupCompletedEvent.name,
                payload: {
                    deviceModel,
                    osName: Platform.OS,
                    wasBackupSkipped: isDeviceBackupRequired,
                    wasPinSkipped,
                    duration: onboardingAnalytics.startTimestamp
                        ? Date.now() - onboardingAnalytics.startTimestamp
                        : undefined,
                    ...onboardingAnalytics,
                },
            });
        },
        [deviceModel, isDeviceBackupRequired, analytics, onboardingAnalytics],
    );
};
