import { useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { selectDeviceModelWithFlagshipFallback } from '@suite-common/device';
import { Box, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { DeviceImage } from './DeviceImage';

const DEVICE_IMAGE_MAX_HEIGHT_RATIO = 0.42;

type FollowDeviceScreenContentProps = {
    titleTxKey: TxKeyPath;
    isTxSigned?: boolean;
};

export const FollowDeviceScreenContent = ({
    titleTxKey,
    isTxSigned = false,
}: FollowDeviceScreenContentProps) => {
    const deviceModel = useSelector(selectDeviceModelWithFlagshipFallback);
    const { height: windowHeight } = useWindowDimensions();

    return (
        <VStack flex={1} spacing="sp24" paddingBottom="sp24" testID="@follow-device">
            <Box flex={1} alignItems="center" justifyContent="center">
                <DeviceImage
                    deviceModel={deviceModel}
                    size="large"
                    maxHeight={windowHeight * DEVICE_IMAGE_MAX_HEIGHT_RATIO}
                />
            </Box>

            {!isTxSigned && (
                <Text variant="headline-md" textAlign="center">
                    <Translation id={titleTxKey} />
                </Text>
            )}
        </VStack>
    );
};
