import { type ReactNode } from 'react';

import { Box, HStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle } from '@trezor/theme';

import { ConnectionDot } from './ConnectionDot';

export type WalletDetailDeviceItemContentProps = {
    headerTextVariant?: NativeTypographyStyle;
    header: ReactNode;
    subHeader?: ReactNode;
    isDeviceInBootloader: boolean;
    isConnected: boolean;
    isPortfolioTrackerDevice: boolean;
};

const headerStyle = prepareNativeStyle(utils => ({
    flexShrink: 1,
    paddingRight: utils.spacings.sp8,
    alignItems: 'center',
    gap: utils.spacings.sp8,
}));

const headerTextStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const WalletDetailDeviceItemContent = ({
    headerTextVariant,
    isConnected,
    header,
    isDeviceInBootloader,
    subHeader,
    isPortfolioTrackerDevice,
}: WalletDetailDeviceItemContentProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box>
            <HStack style={applyStyle(headerStyle)}>
                <Text
                    variant={headerTextVariant}
                    ellipsizeMode="tail"
                    numberOfLines={1}
                    style={applyStyle(headerTextStyle)}
                >
                    {header}
                </Text>
                {!isPortfolioTrackerDevice && (
                    <ConnectionDot
                        isConnected={isConnected}
                        isDeviceInBootloaderMode={isDeviceInBootloader}
                    />
                )}
            </HStack>
            <Text
                variant="body-sm"
                color="textSubdued"
                testID="@deviceManager/walletDetail/subheader"
            >
                {isPortfolioTrackerDevice && (
                    <Translation id="deviceManager.status.portfolioTracker" />
                )}
                {!isPortfolioTrackerDevice && subHeader}
            </Text>
        </Box>
    );
};
