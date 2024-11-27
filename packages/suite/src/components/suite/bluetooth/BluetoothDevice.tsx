import { Column, FlexProps, Icon, Row, Text } from '@trezor/components';
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { BluetoothDevice as BluetoothDeviceType } from '@trezor/transport-bluetooth';
import { models } from '@trezor/connect/src/data/models'; // Todo: solve this import issue
import { DeviceModelInternal } from '@trezor/connect';

type BluetoothDeviceProps = {
    device: BluetoothDeviceType;
    flex?: FlexProps['flex'];
    margin?: FlexProps['margin'];
};

// TODO some config map number => DeviceModelInternal
const getModelEnumFromBytesUtil = (_id: number) => {
    return DeviceModelInternal.T3W1;
};

// TODO some config map number => color id
// discuss final format of it
const getColorEnumFromVariantBytesUtil = (variant: number) => {
    return variant;
};

export const BluetoothDevice = ({ device, flex, margin }: BluetoothDeviceProps) => {
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
