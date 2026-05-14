import { selectFlags } from '@suite/flags';
import { Column, Image, type ImageKey, InfoSegments, Row, Text } from '@trezor/components';
import { type DeviceModelInternal, models } from '@trezor/device-utils';

import { type DesktopBluetoothDevice } from 'src/actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from 'src/hooks/suite';

import { BluetoothDebugInfo } from './BluetoothDebugInfo';

type BluetoothDeviceProps = {
    device: DesktopBluetoothDevice;
};

const getBackColorImage = (model: DeviceModelInternal, color: string): ImageKey => {
    if (model === 'T3W1') {
        const map = {
            '1': 'TREZOR_T3W1_BACKCOLOR_1',
            '2': 'TREZOR_T3W1_BACKCOLOR_2',
            '3': 'TREZOR_T3W1_BACKCOLOR_3',
        } as const satisfies Record<string, ImageKey>;

        return map[color as keyof typeof map] ?? 'TREZOR_T3W1_BACKCOLOR_1';
    }

    return 'TREZOR_UNKNOWN';
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

    const { showBluetoothDebugInfo } = useSelector(selectFlags);

    return (
        <Row gap={12} alignItems="stretch">
            <Column alignItems="center" justifyContent="center" minWidth={22}>
                <Image height="36px" image={getBackColorImage(internalModel, color)} />
            </Column>
            <Column justifyContent="start" alignItems="start" flex="1">
                <Text typographyStyle="body-md">{device.name}</Text>
                {showBluetoothDebugInfo && <BluetoothDebugInfo device={device} />}
                <InfoSegments typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Text>{modelName}</Text>
                    {colorName && <Text>{colorName}</Text>}
                </InfoSegments>
            </Column>
        </Row>
    );
};
