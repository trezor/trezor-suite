import { useSelector } from 'react-redux';

import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { selectHasUnseenNonPhishingTransactionNotifications } from '@suite-common/wallet-core';
import { ActivityCenterButton } from '@suite-native/activity-center';
import { HStack, ScreenHeaderWrapper } from '@suite-native/atoms';

import { DeviceManager } from './DeviceManager';

type DeviceManagerScreenHeaderProps = {
    noBottomPadding?: boolean;
};

export const DeviceManagerScreenHeader = ({
    noBottomPadding,
}: DeviceManagerScreenHeaderProps = {}) => {
    const isActivityCenterEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.activityCenter, true),
    );
    const hasUnseenNotifications = useSelector(selectHasUnseenNonPhishingTransactionNotifications);

    return (
        <ScreenHeaderWrapper noBottomPadding={noBottomPadding}>
            <HStack spacing="sp12">
                <DeviceManager />
                {isActivityCenterEnabled && (
                    <ActivityCenterButton hasUnseenNotifications={hasUnseenNotifications} />
                )}
            </HStack>
        </ScreenHeaderWrapper>
    );
};
