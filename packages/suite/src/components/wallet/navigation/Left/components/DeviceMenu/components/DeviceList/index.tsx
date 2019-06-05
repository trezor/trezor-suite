import React, { PureComponent } from 'react';
import styled from 'styled-components';
import * as deviceUtils from '@suite/utils/device';
import { Icon, colors, icons } from '@trezor/components';

const Wrapper = styled.div``;
const IconClick = styled.div``;

class DeviceList extends PureComponent {
    sortByInstance(a, b) {
        if (!a.instance || !b.instance) return -1;
        return a.instance > b.instance ? 1 : -1;
    }

    render() {
        const { devices, selectedDevice, onSelectDevice, forgetDevice } = this.props;
        return (
            <Wrapper>
                wrapper
                {/* {devices.sort(this.sortByInstance).map(
                    device =>
                        !deviceUtils.isSelectedDevice(selectedDevice, device) && (
                            <DeviceHeader
                                key={device.state || device.path}
                                isAccessible={deviceUtils.isDeviceAccessible(device)}
                                onClickWrapper={() => {
                                    onSelectDevice(device);
                                }}
                                onClickIcon={() => forgetDevice(device)}
                                icon={
                                    <React.Fragment>
                                        <IconClick
                                            onClick={event => {
                                                event.stopPropagation();
                                                event.preventDefault();
                                                forgetDevice(device);
                                            }}
                                        >
                                            <Icon
                                                icon={icons.EJECT}
                                                size={14}
                                                color={colors.TEXT_SECONDARY}
                                            />
                                        </IconClick>
                                    </React.Fragment>
                                }
                                device={device}
                                devices={devices}
                                isHoverable
                            />
                        )
                )} */}
            </Wrapper>
        );
    }
}

export default DeviceList;
