import { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { selectInstacelessUnselectedDevices } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { AnimatedBox, Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { DeviceItem } from './DeviceItem/DeviceItem';
import { MANAGER_MODAL_BOTTOM_RADIUS } from './DeviceManagerModal';

type DeviceListProps = {
    isVisible: boolean;
    onSelectDevice: (device: TrezorDevice) => void;
};

export const ANIMATION_DURATION = 300;

const DEVICE_LIST_TOP_MARGIN = 300; // This is so the bg is consistent even if the device list is dragged down while scrolling
const PADDING_TOP = 12;
const PADDING_BOTTOM = 16;

const listStaticStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderElevation0,
    marginBottom: -MANAGER_MODAL_BOTTOM_RADIUS,
    marginTop: -MANAGER_MODAL_BOTTOM_RADIUS - DEVICE_LIST_TOP_MARGIN,
    paddingTop: MANAGER_MODAL_BOTTOM_RADIUS + PADDING_TOP + DEVICE_LIST_TOP_MARGIN,
    paddingBottom: PADDING_BOTTOM,
    overflow: 'hidden',
    flexGrow: 0,
    zIndex: 10,
    ...utils.boxShadows.small,
}));

export const DeviceList = ({ onSelectDevice }: DeviceListProps) => {
    const { applyStyle } = useNativeStyles();
    const notSelectedInstancelessDevices = useSelector(selectInstacelessUnselectedDevices);

    if (notSelectedInstancelessDevices.length < 1) return;

    return (
        <AnimatedBox
            style={applyStyle(listStaticStyle)}
            entering={FadeInUp.duration(ANIMATION_DURATION)}
            exiting={FadeOutUp.duration(ANIMATION_DURATION)}
        >
            <Box>
                {notSelectedInstancelessDevices.map(
                    d =>
                        d.state && (
                            <DeviceItem
                                key={d.state.staticSessionId}
                                deviceState={d.state}
                                onPress={() => onSelectDevice(d)}
                            />
                        ),
                )}
            </Box>
        </AnimatedBox>
    );
};
