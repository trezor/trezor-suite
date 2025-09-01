import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import {
    CompoundRootState,
    selectSelectedDevice,
    selectShouldRediscover,
} from '@suite-common/wallet-core';
import { Box, InlineAlertBox } from '@suite-native/atoms';
import { DeviceItemIcon } from '@suite-native/device';
import { Translation } from '@suite-native/intl';

type RediscoveryNeededWarningProps = {
    hasPadding?: boolean;
};

export const RediscoveryNeededWarning = ({ hasPadding = false }: RediscoveryNeededWarningProps) => {
    const device = useSelector(selectSelectedDevice);

    const shouldRediscover = useSelector((state: CompoundRootState) =>
        selectShouldRediscover(state, device),
    );

    if (!shouldRediscover) return null;

    return (
        <Animated.View>
            <Box padding={hasPadding ? 'sp8' : undefined}>
                <InlineAlertBox
                    title={<Translation id="assets.rediscoveryNeeded" />}
                    variant="warning"
                    customIcon={<DeviceItemIcon deviceId={device?.id} iconSize="mediumLarge" />}
                />
            </Box>
        </Animated.View>
    );
};
