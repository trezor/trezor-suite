/* @flow */

import React, { PureComponent } from 'react';
import styled from 'styled-components';
import Icon from 'components/Icon';
import DeviceHeader from 'components/DeviceHeader';
import * as deviceUtils from 'utils/device';
import icons from 'config/icons';
import colors from 'config/colors';

import type { TrezorDevice } from 'flowtype';
import type { Props as CommonProps } from '../../../common';


const Wrapper = styled.div``;
const IconClick = styled.div``;

type Props = {
    devices: $ElementType<CommonProps, 'devices'>;
    selectedDevice: $ElementType<$ElementType<CommonProps, 'wallet'>, 'selectedDevice'>;
    onSelectDevice: $ElementType<CommonProps, 'onSelectDevice'>;
    forgetDevice: $ElementType<CommonProps, 'forgetDevice'>;
};

class DeviceList extends PureComponent<Props> {
    sortByInstance(a: TrezorDevice, b: TrezorDevice) {
        if (!a.instance || !b.instance) return -1;
        return a.instance > b.instance ? 1 : -1;
    }

    render() {
        const {
            devices, selectedDevice, onSelectDevice, forgetDevice,
        } = this.props;
        return (
            <Wrapper>
                {devices
                    .sort(this.sortByInstance)
                    .map(device => (
                        !deviceUtils.isSelectedDevice(selectedDevice, device) && (
                            <DeviceHeader
                                key={device.state || device.path}
                                isAccessible={deviceUtils.isDeviceAccessible(device)}
                                onClickWrapper={() => {
                                    onSelectDevice(device);
                                }}
                                onClickIcon={() => forgetDevice(device)}
                                icon={(
                                    <React.Fragment>
                                        <IconClick onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            forgetDevice(device);
                                        }}
                                        >
                                            <Icon
                                                icon={icons.EJECT}
                                                size={25}
                                                color={colors.TEXT_SECONDARY}
                                            />
                                        </IconClick>
                                    </React.Fragment>
                                )}
                                device={device}
                                devices={devices}
                                isHoverable
                            />
                        )
                    ))}

            </Wrapper>
        );
    }
}

export default DeviceList;