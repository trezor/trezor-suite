import React from 'react';

import {
    type DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectDeviceLabelOrNameById,
    selectSelectedDevice,
} from '@suite-common/device';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Box, HStack } from '@suite-native/atoms';
import { selectShouldFactoryResetBeVisible } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import { WalletLabel } from '@suite-native/wallet';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';

import { DeviceItemIcon } from './DeviceItemIcon';
import { SimpleDeviceItemContent } from './SimpleDeviceItemContent';
import { WalletDetailDeviceItemContent } from './WalletDetailDeviceItemContent';

export const DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT = 46;
const DEVICE_SWITCHER_ITEM_CONTENT_HEIGHT_LARGE = 56;

export type DeviceItemContentVariant = 'simple' | 'walletDetail';

export type DeviceItemContentProps = {
    device?: TrezorDevice;
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
        device,
        headerTextVariant = 'body-md',
        variant = 'simple',
        isCompact = true,
        isSubHeaderForceHidden = false,
    }: DeviceItemContentProps) => {
        const { translate } = useTranslate();
        const { applyStyle } = useNativeStyles();

        const deviceItem = useSelectorDeepComparison((state: DeviceRootState) => {
            const d = device ?? selectSelectedDevice(state);

            if (!d) return null;

            return {
                id: d.id,
                name: d.name,
                model: getDeviceInternalModel(d),
                isConnected: d.connected,
                label: selectDeviceLabelOrNameById(state, d.id),
                walletNumber: d.walletNumber,
                isDeviceInBootloaderMode: !device && selectShouldFactoryResetBeVisible(state),
                useEmptyPassphrase: d.useEmptyPassphrase,
                staticSessionId: d.state?.staticSessionId,
            };
        });

        const isPortfolioTrackerDevice = deviceItem?.id === PORTFOLIO_TRACKER_DEVICE_ID;

        const deviceHeader =
            (isPortfolioTrackerDevice ? deviceItem?.name : deviceItem?.label) ??
            translate('deviceManager.defaultHeader');

        // todo: only makes sense device is already authorized (has state)
        const fallbackLabel = deviceItem?.useEmptyPassphrase ? (
            <Translation id="deviceManager.wallet.standard" />
        ) : (
            <Translation
                id="deviceManager.wallet.defaultPassphrase"
                values={{ index: deviceItem?.walletNumber }}
            />
        );

        if (!deviceItem) {
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
                <DeviceItemIcon deviceId={deviceItem.id} deviceModel={deviceItem.model} />
                <Box style={applyStyle(itemStyle, { isCompact })}>
                    {variant === 'simple' ? (
                        <SimpleDeviceItemContent
                            isConnected={deviceItem.isConnected}
                            headerTextVariant={headerTextVariant}
                            header={deviceHeader}
                            isDeviceInBootloader={deviceItem.isDeviceInBootloaderMode}
                            isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                            isSubHeaderForceHidden={isSubHeaderForceHidden}
                        />
                    ) : (
                        <WalletDetailDeviceItemContent
                            headerTextVariant={headerTextVariant}
                            isConnected={deviceItem.isConnected}
                            header={deviceHeader}
                            subHeader={
                                <WalletLabel
                                    deviceStaticSessionId={deviceItem.staticSessionId}
                                    fallbackLabel={fallbackLabel}
                                />
                            }
                            isDeviceInBootloader={deviceItem.isDeviceInBootloaderMode}
                            isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                        />
                    )}
                </Box>
            </HStack>
        );
    },
);
