import { useSelector } from 'react-redux';

import { selectInstacelessUnselectedDevices } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DeviceItem } from './DeviceItem/DeviceItem';

type DeviceListProps = {
    onSelectDevice: (device: TrezorDevice) => void;
    hasBottomBorder: boolean;
};

const PADDING_TOP = 12;
const PADDING_BOTTOM = 16;

const listStaticStyle = prepareNativeStyle<{ hasBottomBorder: boolean }>(
    (utils, { hasBottomBorder }) => ({
        backgroundColor: utils.colors.surfaceFillRaised,
        borderBottomWidth: hasBottomBorder ? utils.borders.widths.small : 0,
        borderBottomColor: utils.colors.borderNeutral,
        paddingTop: PADDING_TOP,
        paddingBottom: PADDING_BOTTOM,
        overflow: 'hidden',
        flexGrow: 0,
        zIndex: 10,
    }),
);

export const DeviceList = ({ onSelectDevice, hasBottomBorder }: DeviceListProps) => {
    const { applyStyle } = useNativeStyles();
    const notSelectedInstancelessDevices = useSelector(selectInstacelessUnselectedDevices);

    if (notSelectedInstancelessDevices.length < 1) return;

    return (
        <Box style={applyStyle(listStaticStyle, { hasBottomBorder })}>
            <Box>
                {notSelectedInstancelessDevices.map(d => (
                    <DeviceItem key={d.id ?? d.path} device={d} onPress={() => onSelectDevice(d)} />
                ))}
            </Box>
        </Box>
    );
};
