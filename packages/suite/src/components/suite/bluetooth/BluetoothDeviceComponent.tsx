import { resolveStaticPath } from '@suite-common/suite-utils';
import { Column, Image, InfoSegments, Row, Text } from '@trezor/components';
import { models } from '@trezor/device-utils';

import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';

type BluetoothDeviceProps = {
    device: DesktopBluetoothDevice;
};

const getTHPVideoColor = (
    device: DesktopBluetoothDevice,
): keyof (typeof models)['T3W1']['colors'] => String(device.manufacturerData.deviceColor || 1); // NOTE: Default color to 1 as 0 doesnt' really exist

export const BluetoothDeviceComponent = ({ device }: BluetoothDeviceProps) => {
    const internalModel = device.manufacturerData.deviceModel;
    const modelConfig = models[internalModel];
    const modelName = modelConfig.name;
    const color = getTHPVideoColor(device);
    const colorName = modelConfig.colors[color.toString()];

    return (
        <Row gap={12} alignItems="stretch">
            <Column alignItems="center" justifyContent="center">
                <Image
                    height="36px"
                    imageSrc={resolveStaticPath(
                        `images/png/t3w1/${internalModel.toLocaleLowerCase()}-back-color-${color}.webp`,
                    )}
                />
            </Column>
            <Column justifyContent="start" alignItems="start" flex="1">
                <Text typographyStyle="body">{device.name}</Text>
                <InfoSegments typographyStyle="hint" variant="tertiary">
                    <Text>{modelName}</Text>
                    {colorName && <Text>{colorName}</Text>}
                </InfoSegments>
            </Column>
        </Row>
    );
};
