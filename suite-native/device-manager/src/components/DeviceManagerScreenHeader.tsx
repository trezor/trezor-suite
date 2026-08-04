import { ActivityCenterButton } from '@suite-native/activity-center';
import { HStack, ScreenHeaderWrapper } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

import { DeviceManager } from './DeviceManager';

export const DeviceManagerScreenHeader = () => {
    const isActivityCenterEnabled = useFeatureFlag(FeatureFlag.IsActivityCenterEnabled);

    return (
        <ScreenHeaderWrapper>
            <HStack spacing="sp12">
                <DeviceManager />
                {isActivityCenterEnabled && <ActivityCenterButton />}
            </HStack>
        </ScreenHeaderWrapper>
    );
};
