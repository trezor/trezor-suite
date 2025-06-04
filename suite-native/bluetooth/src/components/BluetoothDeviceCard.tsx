import { FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useAlert } from '@suite-native/alerts';
import {
    AnimatedCard,
    Box,
    BoxSkeleton,
    Button,
    Card,
    IconButton,
    Text,
    VStack,
} from '@suite-native/atoms';
// TODO: import directly from @suite-native/device leads to circular dependency
import {
    DeviceImage,
    deviceImageSizeToDimensionsMap,
} from '@suite-native/device/src/components/DeviceImage';
import { Translation } from '@suite-native/intl';
import { models } from '@trezor/device-utils';
import { getScreenWidth } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { NativeBluetoothRootState } from '../bluetoothSlice';
import { useBluetoothDevice } from '../hooks/useBluetoothDevice';
import { selectIsKnownBluetoothDevice } from '../selectors';
import { BluetoothDevice } from '../types';

const SKELETON_BUTTON_WIDTH = getScreenWidth() - 64;

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp32,
    gap: utils.spacings.sp24,
}));

const buttonStyle = prepareNativeStyle(_ => ({
    alignSelf: 'stretch',
}));

const knownDeviceHintStyle = prepareNativeStyle(({ spacings }) => ({
    marginVertical: spacings.sp12,
    textAlign: 'center',
}));

const removeButtonStyle = prepareNativeStyle(({ spacings }) => ({
    position: 'absolute',
    top: spacings.sp16,
    right: spacings.sp16,
}));

type BluetoothDeviceCardProps = {
    device: BluetoothDevice;
};

export const BluetoothDeviceCard = ({ device }: BluetoothDeviceCardProps) => {
    const { connectBluetoothDevice, removeBluetoothDevice } = useBluetoothDevice();
    const { showAlert } = useAlert();
    const { applyStyle } = useNativeStyles();

    const { deviceModel, deviceColor } = device.manufacturerData;
    const modelConfig = models[deviceModel];

    const isKnown = useSelector((state: NativeBluetoothRootState) =>
        selectIsKnownBluetoothDevice(state, device),
    );
    const isDisconnected = device.connectionStatus.type === 'disconnected';

    const showRemoveConfirmation = () => {
        showAlert({
            title: <Translation id="bluetooth.deviceCard.removeConfirmation.title" />,
            description: <Translation id="bluetooth.deviceCard.removeConfirmation.description" />,
            primaryButtonTitle: (
                <Translation id="bluetooth.deviceCard.removeConfirmation.primaryButton" />
            ),
            primaryButtonVariant: 'redBold',
            onPressPrimaryButton: () => removeBluetoothDevice(device),
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            secondaryButtonVariant: 'redElevation0',
        });
    };

    return (
        <Card style={applyStyle(cardStyle)}>
            <Box alignItems="center">
                <DeviceImage deviceModel={deviceModel} size="small" />
            </Box>
            <Box alignItems="center">
                <Text variant="titleSmall">{modelConfig.name}</Text>
                <Text variant="hint" color="textSubdued">
                    {modelConfig.colors[deviceColor] ?? 'Unknown'} • {device.name}
                </Text>
            </Box>
            {!isKnown ? (
                <Button
                    isLoading={!isDisconnected}
                    isDisabled={!isDisconnected}
                    onPress={() => connectBluetoothDevice(device)}
                    style={applyStyle(buttonStyle)}
                >
                    <Translation id="bluetooth.deviceCard.connectButton" />
                </Button>
            ) : (
                <>
                    <Text style={applyStyle(knownDeviceHintStyle)}>
                        <Translation id="bluetooth.deviceCard.knownDeviceHint" />
                    </Text>
                    <IconButton
                        iconName="trash"
                        colorScheme="redElevation0"
                        onPress={showRemoveConfirmation}
                        style={applyStyle(removeButtonStyle)}
                    />
                </>
            )}
        </Card>
    );
};

export const BluetoothDeviceCardSkeleton = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <AnimatedCard style={applyStyle(cardStyle)} layout={LinearTransition} exiting={FadeOut}>
            <Box alignItems="center">
                <BoxSkeleton {...deviceImageSizeToDimensionsMap.small} borderRadius="r8" />
            </Box>
            <VStack marginTop="sp2" spacing="sp8" alignItems="center">
                <BoxSkeleton width={128} height={24} borderRadius="r4" />
                <BoxSkeleton width={112} height={16} borderRadius="r4" />
            </VStack>
            <BoxSkeleton width={SKELETON_BUTTON_WIDTH} height={48} borderRadius="round" />
        </AnimatedCard>
    );
};
