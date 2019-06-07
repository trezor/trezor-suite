/* @flow */

import React, { PureComponent } from 'react';
import styled from 'styled-components';
import DeviceItem from '@suite/components/DeviceItem';
import * as deviceUtils from '@suite/utils/device';
import { Icon, colors, icons } from '@trezor/components';

import { TrezorDevice, State } from '@suite/types';

const Wrapper = styled.div``;
const IconClick = styled.div``;

interface Props {
    devices: State['devices'];
    selectedDevice: State['suite']['device'];
    onSelectDevice: (device: TrezorDevice) => void;
    // forgetDevice: $ElementType<CommonProps, 'forgetDevice'>;
}

class DeviceList extends PureComponent<Props> {
    sortByInstance(a: TrezorDevice, b: TrezorDevice) {
        if (!a.instance || !b.instance) return -1;
        return a.instance > b.instance ? 1 : -1;
    }

    render() {
        const { devices, selectedDevice, onSelectDevice } = this.props;
        return (
            <Wrapper>
                {devices.sort(this.sortByInstance).map(
                    device =>
                        !deviceUtils.isSelectedDevice(selectedDevice, device) && (
                            <DeviceItem
                                key={device.state || device.path}
                                isAccessible={deviceUtils.isDeviceAccessible(device)}
                                onClick={() => {
                                    onSelectDevice(device);
                                }}
                                icon={
                                    <React.Fragment>
                                        <IconClick
                                            onClick={event => {
                                                event.stopPropagation();
                                                event.preventDefault();
                                                // forgetDevice(device);
                                            }}
                                        >
                                            <Icon
                                                icon={icons.EJECT}
                                                size={14}
                                                color={colors.TEXT_SECONDARY}
                                                hoverColor={colors.TEXT_PRIMARY}
                                            />
                                        </IconClick>
                                    </React.Fragment>
                                }
                                device={device}
                                isHoverable
                            />
                        ),
                )}
            </Wrapper>
        );
    }
}

export default DeviceList;
