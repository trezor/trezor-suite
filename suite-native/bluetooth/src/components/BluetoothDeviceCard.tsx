import {
    Box,
    Button,
    Card,
    type InlineAlertBoxProps,
    Text,
    resetLetterSpacingOnAndroidStyle,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { models } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { type BluetoothDevice } from '../types';
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

    const isConnecting = variant === 'connect' && device.connectionStatus.type !== 'disconnected';
    const isPairingInProgress = variant === 'connect' && device.connectionStatus.type === 'pairing';
    const pairingHintInlineAlert: InlineAlertBoxProps = {
        title: <Translation id="bluetooth.deviceCard.connect.pairingHint" />,
        variant: 'info',
    };

    return (
        <Card
            style={applyStyle(cardStyle)}
            alertProps={isPairingInProgress ? pairingHintInlineAlert : undefined}
            alertPosition="bottom"
        >
            <Box alignItems="center">
                <DeviceColorImage color={deviceColor} />
            </Box>
            <Box alignItems="center">
                <Text variant="headline-sm">{device.name}</Text>
                <Text
                    variant="body-sm"
                    color="textSubdued"
                    style={applyStyle(resetLetterSpacingOnAndroidStyle)}
                >
                    {modelConfig.name}
                    {' • '}
                    {modelConfig.colors[deviceColor] ?? (
                        <Translation id="bluetooth.deviceCard.unknownColor" />
                    )}
                </Text>
            </Box>
            <Button
                isLoading={isConnecting}
                isDisabled={isConnecting}
                onPress={() => onButtonPress(device)}
                style={applyStyle(buttonStyle)}
            >
                <Translation id={buttonTranslation} />
            </Button>
        </Card>
    );
};
