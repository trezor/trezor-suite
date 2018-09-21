import React, { Component } from 'react';
import styled from 'styled-components';
import Icon from 'components/Icon';
import DeviceHeader from 'components/DeviceHeader';
import icons from 'config/icons';
import colors from 'config/colors';

const Wrapper = styled.div``;
const IconClick = styled.div``;

class DeviceList extends Component {
    sortByInstance(a, b) {
        if (!a.instance || !b.instance) return -1;
        return a.instance > b.instance ? 1 : -1;
    }

    render() {
        const { devices, selectedDevice, onSelectDevice } = this.props;
        return (
            <Wrapper>
                {devices
                    .sort(this.sortByInstance)
                    .map(device => (
                        device !== selectedDevice && (
                            <DeviceHeader
                                key={device.state || device.path}
                                disabled={device.features && device.features.bootloader_mode}
                                onClickWrapper={() => {
                                    if (device.features
                                    && !device.features.bootloader_mode) {
                                        onSelectDevice(device);
                                    }
                                }}
                                onClickIcon={() => this.onDeviceMenuClick({ type: 'forget', label: '' }, device)}
                                icon={(
                                    <React.Fragment>
                                        <IconClick onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                            this.onDeviceMenuClick({ type: 'forget', label: '' }, device);
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