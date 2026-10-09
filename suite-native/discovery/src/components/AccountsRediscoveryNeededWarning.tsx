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
import { BannerInline, Box } from '@suite-native/atoms';
import { deviceModelToIconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import type { NativeSpacing } from '@trezor/theme';

type RediscoveryNeededWarningProps = {
    margin?: NativeSpacing;
    marginHorizontal?: NativeSpacing;
    marginBottom?: NativeSpacing;
};

export const AccountsRediscoveryNeededWarning = (props: RediscoveryNeededWarningProps) => {
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
    ) {
        return null;
    }

    return (
        <Box {...props}>
            <BannerInline
                title={<Translation id="assets.rediscoveryNeeded" />}
                intent="warning"
                iconName={deviceModelToIconName(deviceModel)}
            />
        </Box>
    );
};
