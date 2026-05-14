import React from 'react';
import { useSelector } from 'react-redux';

import {
    type DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceByState,
    selectDeviceLabelOrNameById,
    selectSelectedDevice,
} from '@suite-common/device';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Box, HStack } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { WalletLabel } from '@suite-native/labeling';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';

import { DeviceItemIcon } from './DeviceItemIcon';
import { SimpleDeviceItemContent } from './SimpleDeviceItemContent';
import { WalletDetailDeviceItemContent } from './WalletDetailDeviceItemContent';

export const DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT = 46;
const DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT_LARGE = 56;

export type DeviceItemContentVariant = 'simple' | 'walletDetail';

export type DeviceItemContentProps = {
    deviceState: TrezorDevice['state'] | undefined;
    headerTextVariant?: NativeTypographyStyle;
    variant?: DeviceItemContentVariant;
    isCompact?: boolean;
    isSubHeaderForceHidden?: boolean;
};

export const contentWrapperStyle = prepareNativeStyle<{ height: number }>((utils, { height }) => ({
    flexShrink: 1,
    height: height * ACCESSIBILITY_FONTSIZE_MULTIPLIER,
    alignItems: 'center',
    spacing: utils.spacings.sp16,
}));

export const itemStyle = prepareNativeStyle<{ isCompact: boolean }>((utils, { isCompact }) => ({
    flexShrink: 1,
    extend: {
        condition: !isCompact,
        style: {
            gap: utils.spacings.sp2,
        },
    },
}));

export const DeviceItemContent = React.memo(
    ({
        deviceState,
        headerTextVariant = 'body-md',
        variant = 'simple',
        isCompact = true,
        isSubHeaderForceHidden = false,
    }: DeviceItemContentProps) => {
        const { translate } = useTranslate();
        const { applyStyle } = useNativeStyles();
        const shouldFactoryResetBeVisible = useSelector(selectShouldFactoryResetBeVisible);
        const selectedDevice = useSelector(selectSelectedDevice);

        const device = useSelectorDeepComparison((state: DeviceRootState) => {
            // select only what is needed to avoid unnecessary rerenders
            const d = selectDeviceByState(state, deviceState);

            if (!d && shouldFactoryResetBeVisible)
                return {
                    id: 'bootloader_device',
                    name: selectedDevice?.name,
                    label: selectedDevice?.label,
                    walletNumber: 1,
                    isConnected: true,
                    isDeviceInBootloaderMode: true,
                    useEmptyPassphrase: selectedDevice?.useEmptyPassphrase,
                };

            if (!d) return null;

            return {
                id: d.id,
                name: d.name,
                isConnected: d.connected,
                label: selectDeviceLabelOrNameById(state, d.id),
                walletNumber: d.walletNumber,
                isDeviceInBootloaderMode: false,
                useEmptyPassphrase: d.useEmptyPassphrase,
            };
        });
        const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

        const isPortfolioTrackerDevice = device?.id === PORTFOLIO_TRACKER_DEVICE_ID;

        const deviceHeader =
            (isPortfolioTrackerDevice ? device?.name : device?.label) ??
            translate('deviceManager.defaultHeader');

        // todo: only makes sense device is already authorized (has state)
        const fallbackLabel = device?.useEmptyPassphrase ? (
            <Translation id="deviceManager.wallet.standard" />
        ) : (
            <Translation
                id="deviceManager.wallet.defaultPassphrase"
                values={{ index: device?.walletNumber }}
            />
        );

        if (!device) {
            return null;
        }

        return (
            <HStack
                style={applyStyle(contentWrapperStyle, {
                    height: isCompact
                        ? DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT
                        : DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT_LARGE,
                })}
            >
                <DeviceItemIcon deviceId={hasOnlyEmptyPortfolioTracker ? undefined : device.id} />
                <Box style={applyStyle(itemStyle, { isCompact })}>
                    {variant === 'simple' ? (
                        <SimpleDeviceItemContent
                            isConnected={device.isConnected}
                            headerTextVariant={headerTextVariant}
                            header={deviceHeader}
                            isDeviceInBootloader={device.isDeviceInBootloaderMode}
                            isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                            isSubHeaderForceHidden={isSubHeaderForceHidden}
                        />
                    ) : (
                        <WalletDetailDeviceItemContent
                            headerTextVariant={headerTextVariant}
                            isConnected={device.isConnected}
                            header={deviceHeader}
                            subHeader={
                                <WalletLabel
                                    deviceStaticSessionId={deviceState?.staticSessionId}
                                    fallbackLabel={fallbackLabel}
                                />
                            }
                            isDeviceInBootloader={device.isDeviceInBootloaderMode}
                            isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                        />
                    )}
                </Box>
            </HStack>
        );
    },
);
