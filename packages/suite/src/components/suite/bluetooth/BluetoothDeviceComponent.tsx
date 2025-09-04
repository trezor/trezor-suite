import { Column, FlexProps, InfoSegments, Row, Text } from '@trezor/components';
import { models } from '@trezor/device-utils';
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { BluetoothDebugInfo } from './BluetoothDebugInfo';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from '../../../hooks/suite';

type BluetoothDeviceProps = {
    device: DesktopBluetoothDevice;
    flex?: FlexProps['flex'];
    margin?: FlexProps['margin'];
};

export const BluetoothDeviceComponent = ({ device, flex, margin }: BluetoothDeviceProps) => {
    const internalModel = device.manufacturerData.deviceModel;
    const modelConfig = models[internalModel];
    const modelName = modelConfig.name;
    const color = device.manufacturerData.deviceColor;
    const colorName = modelConfig.colors[color.toString()];

    const { showBluetoothDebugInfo } = useSelector(selectSuiteFlags);

    return (
        <Row gap={spacings.md} alignItems="stretch" flex={flex} margin={margin}>
            <RotateDeviceImage
                deviceModel={internalModel}
                deviceColor={color}
                animationHeight="44px"
                animationWidth="44px"
            />

            <Column justifyContent="start" alignItems="start" flex="1">
                <Text typographyStyle="body">{modelName}</Text>
                {showBluetoothDebugInfo && <BluetoothDebugInfo device={device} />}

                <InfoSegments>
                    {colorName && (
                        <Text typographyStyle="hint" variant="tertiary">
                            {colorName}
                        </Text>
                    )}
                    <Text typographyStyle="hint" variant="tertiary">
                        {device.name}
                    </Text>
                </InfoSegments>
            </Column>
        </Row>
    );
};
