import { useSelector } from 'react-redux';

import { selectDeviceModelWithFlagshipFallback } from '@suite-common/device';
import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { getScreenHeight } from '@trezor/env-utils';

import { DeviceImage } from './DeviceImage';

const SCREEN_HEIGHT = getScreenHeight();

type FollowDeviceScreenContentProps = {
    titleTxKey: TxKeyPath;
};

export const FollowDeviceScreenContent = ({ titleTxKey }: FollowDeviceScreenContentProps) => {
    const deviceModel = useSelector(selectDeviceModelWithFlagshipFallback);

    return (
        <VStack flex={1} spacing="sp24" paddingBottom="sp24" testID="@follow-device">
            <Box flex={1} alignItems="center" justifyContent="center">
                <DeviceImage
                    deviceModel={deviceModel}
                    size="large"
                    maxHeight={0.42 * SCREEN_HEIGHT}
                />
            </Box>
            <Text variant="headline-md" textAlign="center">
                <Translation id={titleTxKey} />
            </Text>
        </VStack>
    );
};
