import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/device';
import { Box, Text, VStack } from '@suite-native/atoms';
import { DeviceImage } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';

const SCREEN_HEIGHT = getScreenHeight();

export const EarnFollowDeviceContent = () => {
    const deviceModel = useSelector(selectDeviceModel);

    return (
        <VStack
            flex={1}
            spacing="sp24"
            paddingBottom="sp24"
            testID="@earn/follow-device-instructions"
        >
            <Box flex={1} alignItems="center" justifyContent="center">
                <DeviceImage
                    deviceModel={deviceModel ?? DeviceModelInternal.UNKNOWN}
                    size="large"
                    maxHeight={0.42 * SCREEN_HEIGHT}
                />
            </Box>
            <Text variant="headline-md" textAlign="center">
                <Translation id="earn.unstakeTransactionDataReviewScreen.followDeviceInstructions" />
            </Text>
        </VStack>
    );
};
