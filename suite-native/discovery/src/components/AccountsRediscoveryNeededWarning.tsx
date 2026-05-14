import { useSelector } from 'react-redux';

import {
    type DeviceRootState,
    selectDeviceModelById,
    selectIsDeviceConnected,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type WalletCoreCompoundRootState,
    selectShouldRediscover,
} from '@suite-common/wallet-core';
import { Box, InlineAlertBox } from '@suite-native/atoms';
import { DeviceModelIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type RediscoveryNeededWarningProps = {
    hasPadding?: boolean;
};

export const AccountsRediscoveryNeededWarning = ({
    hasPadding = false,
}: RediscoveryNeededWarningProps) => {
    const device = useSelector(selectSelectedDevice);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const deviceModel = useSelector((state: DeviceRootState) =>
        selectDeviceModelById(state, device?.id),
    );

    const shouldRediscover = useSelector(
        (state: WalletCoreCompoundRootState) => device && selectShouldRediscover(state, device),
    );

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const shouldUserBePromptedToReconnectDevice = !shouldRediscover;

    if (
        shouldUserBePromptedToReconnectDevice ||
        !deviceModel ||
        isDeviceConnected ||
        isPortfolioTrackerDevice
    )
        return null;

    return (
        <Box padding={hasPadding ? 'sp8' : undefined}>
            <InlineAlertBox
                title={<Translation id="assets.rediscoveryNeeded" />}
                variant="warning"
                viewLeft={<DeviceModelIcon deviceModel={deviceModel} size="mediumLarge" />}
            />
        </Box>
    );
};
