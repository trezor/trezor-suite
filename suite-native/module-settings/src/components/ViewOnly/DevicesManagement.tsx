import { useSelector } from 'react-redux';

import { Box, Card, Divider, HStack, Text } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { selectPhysicalDevicesGrouppedById } from '@suite-common/wallet-core';
import { Icon, IconName } from '@suite-common/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { About, AboutProps } from './About';
import { TrezorModelIcon } from './TrezorModelIcon';
import { WalletRow } from './WalletRow';

type ConnectionStyle = { color: Color; iconName: IconName; translationKey: TxKeyPath };

const connectionStyleMap = {
    connected: {
        color: 'textSecondaryHighlight',
        iconName: 'linkChain',
        translationKey: 'moduleSettings.viewOnly.connected',
    },
    disconnected: {
        color: 'textSubdued',
        iconName: 'linkChainBroken',
        translationKey: 'moduleSettings.viewOnly.disconnected',
    },
} as const satisfies Record<string, ConnectionStyle>;

const cardStyle = prepareNativeStyle(utils => ({
    padding: 0,
    marginTop: utils.spacings.large,
}));

const deviceStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.medium,
    alignItems: 'center',
    gap: 12,
}));

export const DevicesManagement = ({ onPressAbout }: AboutProps) => {
    const deviceGroups = useSelector(selectPhysicalDevicesGrouppedById);
    const { applyStyle } = useNativeStyles();

    return (
        <>
            <Box paddingHorizontal="large">
                <About onPressAbout={onPressAbout} />
            </Box>
            {deviceGroups.map(devices => {
                const [firstDevice] = devices;
                const connectionStyle =
                    connectionStyleMap[firstDevice.connected ? 'connected' : 'disconnected'];

                return (
                    <Card key={firstDevice.id} style={applyStyle(cardStyle)}>
                        <HStack style={applyStyle(deviceStyle)}>
                            <TrezorModelIcon device={firstDevice} />
                            <Box>
                                <Text variant="highlight" color="textDefault">
                                    {firstDevice.label}
                                </Text>
                                <HStack alignItems="center" spacing="extraSmall">
                                    <Icon
                                        name={connectionStyle.iconName}
                                        size="medium"
                                        color={connectionStyle.color}
                                    />
                                    <Text variant="hint" color={connectionStyle.color}>
                                        <Translation id={connectionStyle.translationKey} />
                                    </Text>
                                </HStack>
                            </Box>
                        </HStack>
                        <Divider />
                        {devices.map(device => (
                            <WalletRow key={`${device.state}`} device={device} />
                        ))}
                    </Card>
                );
            })}
        </>
    );
};
