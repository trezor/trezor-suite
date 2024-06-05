import React from 'react';
import { useSelector } from 'react-redux';

import { HStack, Box } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    selectDeviceByState,
    DeviceRootState,
    PORTFOLIO_TRACKER_DEVICE_ID,
    selectHasOnlyEmptyPortfolioTracker,
} from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TypographyStyle } from '@trezor/theme';
import { TrezorDevice } from '@suite-common/suite-types';

import { DeviceItemIcon } from './DeviceItemIcon';
import { SimpleDeviceItemContent } from './SimpleDeviceItemContent';
import { WalletDetailDeviceItemContent } from './WalletDetailDeviceItemContent';

export type DeviceItemContentVariant = 'simple' | 'walletDetail';

export type DeviceItemContentMode = 'compact' | 'header';

export type DeviceItemContentProps = {
    deviceState: NonNullable<TrezorDevice['state']>;
    headerTextVariant?: TypographyStyle;
    variant?: DeviceItemContentVariant;
    isCompact?: boolean;
    isSubHeaderForceHidden?: boolean;
};

const contentWrapperStyle = prepareNativeStyle<{ height: number }>((utils, { height }) => ({
    flexShrink: 1,
    height,
    alignItems: 'center',
    spacing: utils.spacings.medium,
}));

const itemStyle = prepareNativeStyle<{ isCompact: boolean }>((_, { isCompact }) => ({
    flexShrink: 1,
    extend: {
        condition: !isCompact,
        style: {
            gap: 2,
        },
    },
}));

export const DeviceItemContent = ({
    deviceState,
    headerTextVariant = 'body',
    variant = 'simple',
    isCompact = true,
    isSubHeaderForceHidden = false,
}: DeviceItemContentProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();

    const device = useSelector((state: DeviceRootState) => selectDeviceByState(state, deviceState));
    const hasOnlyEmptyPortfolioTracker = useSelector(selectHasOnlyEmptyPortfolioTracker);

    const isPortfolioTrackerDevice = device?.id === PORTFOLIO_TRACKER_DEVICE_ID;

    const deviceHeader =
        (isPortfolioTrackerDevice ? device?.name : device?.label) ??
        translate('deviceManager.defaultHeader');

    const walletNameLabel = device?.useEmptyPassphrase ? (
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
        <HStack style={applyStyle(contentWrapperStyle, { height: isCompact ? 46 : 56 })}>
            <DeviceItemIcon deviceId={hasOnlyEmptyPortfolioTracker ? undefined : device.id} />
            <Box style={applyStyle(itemStyle, { isCompact })}>
                {variant === 'simple' ? (
                    <SimpleDeviceItemContent
                        deviceState={deviceState}
                        headerTextVariant={headerTextVariant}
                        header={deviceHeader}
                        isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                        isSubHeaderForceHidden={isSubHeaderForceHidden}
                    />
                ) : (
                    <WalletDetailDeviceItemContent
                        deviceState={deviceState}
                        headerTextVariant={headerTextVariant}
                        header={deviceHeader}
                        subHeader={walletNameLabel}
                        isPortfolioTrackerDevice={isPortfolioTrackerDevice}
                    />
                )}
            </Box>
        </HStack>
    );
};
