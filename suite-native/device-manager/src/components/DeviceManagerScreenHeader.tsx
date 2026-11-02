import { useSelector } from 'react-redux';

import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { selectHasUnseenNonPhishingTransactionNotifications } from '@suite-common/wallet-core';
import { ActivityCenterButton } from '@suite-native/activity-center';
import { Box, HStack, ScreenHeaderWrapper } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DeviceManager } from './DeviceManager';
import { useDeviceManager } from '../hooks/useDeviceManager';

const activityCenterButtonStyle = prepareNativeStyle<{ isDeviceManagerVisible: boolean }>(
    (_, { isDeviceManagerVisible }) => ({
        opacity: isDeviceManagerVisible ? 0 : 1,
    }),
);

type DeviceManagerScreenHeaderProps = {
    noBottomPadding?: boolean;
};

export const DeviceManagerScreenHeader = ({
    noBottomPadding,
}: DeviceManagerScreenHeaderProps = {}) => {
    const { applyStyle } = useNativeStyles();
    const { isDeviceManagerVisible } = useDeviceManager();
    const isActivityCenterEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.activityCenter, true),
    );
    const hasUnseenNotifications = useSelector(selectHasUnseenNonPhishingTransactionNotifications);

    return (
        <ScreenHeaderWrapper noBottomPadding={noBottomPadding}>
            <HStack spacing="sp12">
                <DeviceManager />
                {isActivityCenterEnabled && (
                    <Box style={applyStyle(activityCenterButtonStyle, { isDeviceManagerVisible })}>
                        <ActivityCenterButton hasUnseenNotifications={hasUnseenNotifications} />
                    </Box>
                )}
            </HStack>
        </ScreenHeaderWrapper>
    );
};
