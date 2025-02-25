import { Column, FlexProps, Icon, Row, Text } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { models } from '@trezor/connect/src/data/models'; // Todo: solve this import issue
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice } from '@trezor/transport-bluetooth';

type BluetoothDeviceProps = {
    device: BluetoothDevice;
    flex?: FlexProps['flex'];
    margin?: FlexProps['margin'];
};

// TODO some config map number => DeviceModelInternal
const getModelEnumFromBytesUtil = (_id: number) => DeviceModelInternal.T3W1;

// TODO some config map number => color id
// discuss final format of it
const getColorEnumFromVariantBytesUtil = (variant: number) => variant;

export const BluetoothDeviceComponent = ({ device, flex, margin }: BluetoothDeviceProps) => {
    console.log('____ BluetoothDeviceComponent :: device', device);

    const model = getModelEnumFromBytesUtil(device.data[2]);
    const color = getColorEnumFromVariantBytesUtil(device.data[1]);
    const colorName = models[model].colors[color.toString()];

    return (
        <Row gap={spacings.md} alignItems="stretch" flex={flex} margin={margin}>
            <RotateDeviceImage
                deviceModel={model}
                deviceColor={color}
                animationHeight="44px"
                animationWidth="44px"
            />

            <Column justifyContent="start" alignItems="start" flex="1">
                <Text typographyStyle="body">Trezor Safe 7</Text>

                <Row>
                    <Text typographyStyle="hint" variant="tertiary">
                        {colorName}
                    </Text>
                    <Icon name="dot" />
                    <Text typographyStyle="hint" variant="tertiary">
                        {device.name}
                    </Text>
                </Row>
            </Column>
        </Row>
    );
};
