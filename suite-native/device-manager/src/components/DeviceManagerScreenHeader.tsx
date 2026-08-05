import { useSelector } from 'react-redux';

import { selectHasUnseenNotifications } from '@suite-common/toast-notifications';
import { ActivityCenterButton } from '@suite-native/activity-center';
import { HStack, ScreenHeaderWrapper } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { DeviceManager } from './DeviceManager';

export const DeviceManagerScreenHeader = () => {
    const isActivityCenterEnabled = useFeatureFlag(FeatureFlag.IsActivityCenterEnabled);
    const hasUnseenNotifications = useSelector(selectHasUnseenNotifications);

    return (
        <ScreenHeaderWrapper>
            <HStack spacing="sp12">
                <DeviceManager />
                {isActivityCenterEnabled && (
                    <ActivityCenterButton hasUnseenNotifications={hasUnseenNotifications} />
                )}
            </HStack>
        </ScreenHeaderWrapper>
    );
};
