import { Box, Button, Card, Text } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { models } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { BluetoothDevice } from '../types';
import { DeviceColorImage } from './DeviceColorImage';

type Variant = 'connect' | 'remove';

type BluetoothDeviceCardProps = {
    variant: 'connect' | 'remove';
    device: BluetoothDevice;
    onButtonPress: (device: BluetoothDevice) => void;
};

const variantToButtonTranslationMap = {
    connect: 'bluetooth.deviceCard.connect.actionButton',
    remove: 'bluetooth.deviceCard.remove.actionButton',
} as const satisfies Record<Variant, TxKeyPath>;

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp32,
    gap: utils.spacings.sp24,
}));

const buttonStyle = prepareNativeStyle(_ => ({
    alignSelf: 'stretch',
}));

export const BluetoothDeviceCard = ({
    variant,
    device,
    onButtonPress,
}: BluetoothDeviceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const buttonTranslation = variantToButtonTranslationMap[variant];
    const { deviceModel, deviceColor } = device.manufacturerData;
    const modelConfig = models[deviceModel];

    const isLoading = variant === 'connect' && device.connectionStatus.type !== 'disconnected';

    return (
        <Card style={applyStyle(cardStyle)}>
            <Box alignItems="center">
                <DeviceColorImage color={deviceColor} />
            </Box>
            <Box alignItems="center">
                <Text variant="titleSmall">{modelConfig.name}</Text>
                <Text variant="hint" color="textSubdued">
                    {modelConfig.colors[deviceColor] ?? (
                        <Translation id="bluetooth.deviceCard.unknownColor" />
                    )}{' '}
                    • {device.name}
                </Text>
            </Box>
            <Button
                isLoading={isLoading}
                isDisabled={isLoading}
                onPress={() => onButtonPress(device)}
                style={applyStyle(buttonStyle)}
            >
                <Translation id={buttonTranslation} />
            </Button>
        </Card>
    );
};
