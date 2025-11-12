import { useSelector } from 'react-redux';

import {
    DeviceRootState,
    WalletCoreCompoundRootState,
    selectDeviceModelById,
    selectIsDeviceConnected,
    selectIsPortfolioTrackerDevice,
    selectSelectedDevice,
    selectShouldAccountsBeRediscovered,
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

    const shouldRediscover = useSelector((state: WalletCoreCompoundRootState) =>
        selectShouldRediscover(state, device),
    );
    const shouldAccountsBeRediscovered = useSelector((state: WalletCoreCompoundRootState) =>
        selectShouldAccountsBeRediscovered(state, device?.state?.staticSessionId),
    );

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const shouldUserBePromptedToReconnectDevice =
        !shouldRediscover && !shouldAccountsBeRediscovered;

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
