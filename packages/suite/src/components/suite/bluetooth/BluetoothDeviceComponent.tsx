import { Column, InfoSegments, Row, Text } from '@trezor/components';
import { models } from '@trezor/device-utils';
import { RotateDeviceImage } from '@trezor/product-components';

import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { BluetoothDebugInfo } from './BluetoothDebugInfo';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from '../../../hooks/suite';

type BluetoothDeviceProps = {
    device: DesktopBluetoothDevice;
};

export const BluetoothDeviceComponent = ({ device }: BluetoothDeviceProps) => {
    const internalModel = device.manufacturerData.deviceModel;
    const modelConfig = models[internalModel];
    const modelName = modelConfig.name;
    const color = device.manufacturerData.deviceColor;
    const colorName = modelConfig.colors[color.toString()];

    const { showBluetoothDebugInfo } = useSelector(selectSuiteFlags);

    return (
        <Row gap={12} alignItems="stretch">
            <RotateDeviceImage
                deviceModel={internalModel}
                deviceColor={color}
                animationHeight="44px"
                animationWidth="44px"
            />
            <Column justifyContent="start" alignItems="start" flex="1">
                <Text typographyStyle="body">{modelName}</Text>
                {showBluetoothDebugInfo && <BluetoothDebugInfo device={device} />}
                <InfoSegments typographyStyle="hint" variant="tertiary">
                    {colorName && <Text>{colorName}</Text>}
                    <Text>{device.name}</Text>
                </InfoSegments>
            </Column>
        </Row>
    );
};
