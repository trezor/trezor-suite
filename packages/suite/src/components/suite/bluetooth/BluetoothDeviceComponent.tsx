import { Column, FlexProps, InfoSegments, Row, Text } from '@trezor/components';
import { models } from '@trezor/device-utils';
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { BluetoothDebugInfo } from './BluetoothDebugInfo';
import { DesktopBluetoothDevice } from '../../../actions/bluetooth/DesktopBluetoothDevice';
import { useSelector } from '../../../hooks/suite';
import { selectSuiteFlags } from '../../../reducers/suite/suiteReducer';

type BluetoothDeviceProps = {
    device: DesktopBluetoothDevice;
    flex?: FlexProps['flex'];
    margin?: FlexProps['margin'];
};

export const BluetoothDeviceComponent = ({ device, flex, margin }: BluetoothDeviceProps) => {
    const model = device.manufacturerData.deviceModel;
    const color = device.manufacturerData.deviceColor;
    const colorName = models[model]?.colors[color.toString()];

    const { showBluetoothDebugInfo } = useSelector(selectSuiteFlags);

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
