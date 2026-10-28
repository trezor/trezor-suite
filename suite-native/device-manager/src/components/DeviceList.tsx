import { useSelector } from 'react-redux';

import { selectInstacelessUnselectedDevices } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { MANAGER_MODAL_BOTTOM_RADIUS } from './DeviceManagerModal';

type DeviceListProps = {
    onSelectDevice: (device: TrezorDevice) => void;
};

const PADDING_TOP = 12;
const PADDING_BOTTOM = 16;

const listStaticStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderNeutral,
    borderTopWidth: 0,
    marginHorizontal: utils.spacings.sp16,
    paddingTop: PADDING_TOP,
    paddingBottom: PADDING_BOTTOM,
    overflow: 'hidden',
    flexGrow: 0,
    zIndex: 10,
}));

export const DeviceList = ({ onSelectDevice }: DeviceListProps) => {
    const { applyStyle } = useNativeStyles();
    const notSelectedInstancelessDevices = useSelector(selectInstacelessUnselectedDevices);

    if (notSelectedInstancelessDevices.length < 1) return;

    return (
        <Box style={applyStyle(listStaticStyle)}>
            <Box>
                {notSelectedInstancelessDevices.map(d => (
                    <DeviceItem key={d.id ?? d.path} device={d} onPress={() => onSelectDevice(d)} />
                ))}
            </Box>
        </Box>
    );
};
